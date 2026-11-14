// End-to-end check of the relay. Needs Node.js 22+ (global WebSocket).
// Usage:  RELAY=https://your-relay-host node test/e2e.mjs [--slow]
import assert from "node:assert/strict";

const RELAY = (process.env.RELAY || "").replace(/\/$/, "");
if (!RELAY) {
  console.error("Set RELAY, e.g. RELAY=https://host node test/e2e.mjs");
  process.exit(2);
}
const WS_BASE = RELAY.replace(/^http/, "ws");
const SLOW = process.argv.includes("--slow");

const newId = () => Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64url");
const bytes = (...n) => new Uint8Array(n).buffer;
const isText = (m) => typeof m === "string";

function connect(id, role) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_BASE}/v1/session/${id}?role=${role}`);
    ws.binaryType = "arraybuffer";
    const inbox = [];
    const waiters = [];
    const closeWaiters = [];
    let closed = null;
    let opened = false;

    ws.addEventListener("message", (e) => {
      const w = waiters.shift();
      if (w) { clearTimeout(w.timer); w.resolve(e.data); } else inbox.push(e.data);
    });
    ws.addEventListener("close", (e) => {
      closed = { code: e.code, reason: e.reason };
      waiters.splice(0).forEach((w) => { clearTimeout(w.timer); w.reject(new Error(`closed ${e.code}`)); });
      closeWaiters.splice(0).forEach((w) => { clearTimeout(w.timer); w.resolve(closed); });
      if (!opened) reject(new Error("connect failed"));
    });
    ws.addEventListener("error", () => { if (!opened) reject(new Error("connect failed")); });
    ws.addEventListener("open", () => {
      opened = true;
      resolve({
        send: (d) => ws.send(d),
        close: () => ws.close(1000),
        next: (ms = 5000) =>
          inbox.length
            ? Promise.resolve(inbox.shift())
            : closed
              ? Promise.reject(new Error(`closed ${closed.code}`))
              : new Promise((res, rej) => {
                  const timer = setTimeout(() => rej(new Error("timeout waiting for message")), ms);
                  waiters.push({ resolve: res, reject: rej, timer });
                }),
        waitClose: (ms = 5000) =>
          closed
            ? Promise.resolve(closed)
            : new Promise((res, rej) => {
                const timer = setTimeout(() => rej(new Error("timeout waiting for close")), ms);
                closeWaiters.push({ resolve: res, reject: rej, timer });
              }),
      });
    });
  });
}

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test("health", async () => {
  const r = await fetch(`${RELAY}/health`);
  assert.equal(await r.text(), "ok");
});

test("root serves the info page", async () => {
  const r = await fetch(`${RELAY}/`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-type"), /text\/html/);
  assert.match(await r.text(), /Sparrow Relay/);
});

test("unknown path and bad id -> 404", async () => {
  assert.equal((await fetch(`${RELAY}/nope`)).status, 404);
  assert.equal((await fetch(`${RELAY}/v1/session/short`)).status, 404);
});

test("guest cannot create a session", async () => {
  await assert.rejects(connect(newId(), "guest"));
});

test("host and guest exchange binary messages", async () => {
  const id = newId();
  const host = await connect(id, "host");
  const guest = await connect(id, "guest");
  assert.equal(await host.next(), "peer-joined");
  host.send(bytes(1, 2, 3));
  assert.deepEqual(new Uint8Array(await guest.next()), new Uint8Array([1, 2, 3]));
  guest.send(bytes(9, 8));
  assert.deepEqual(new Uint8Array(await host.next()), new Uint8Array([9, 8]));
  host.close();
});

test("text frames from clients are rejected (1003)", async () => {
  const id = newId();
  const host = await connect(id, "host");
  const guest = await connect(id, "guest");
  await host.next(); // peer-joined
  guest.send("hello");
  assert.equal((await guest.waitClose()).code, 1003);
  host.close();
});

test("message over 2 MiB is rejected (1009)", async () => {
  const id = newId();
  const host = await connect(id, "host");
  const guest = await connect(id, "guest");
  await host.next();
  guest.send(new Uint8Array(2 * 1024 * 1024 + 1));
  assert.equal((await guest.waitClose(10000)).code, 1009);
  host.close();
});

test("second host / second guest is refused", async () => {
  const id = newId();
  const host = await connect(id, "host");
  await assert.rejects(connect(id, "host"));
  const guest = await connect(id, "guest");
  await host.next();
  await assert.rejects(connect(id, "guest"));
  guest.close();
  host.close();
});

test("host leaving closes the session and the guest", async () => {
  const id = newId();
  const host = await connect(id, "host");
  const guest = await connect(id, "guest");
  await host.next();
  host.close();
  assert.equal(await guest.next(), "session-ended");
  await assert.rejects(connect(id, "guest")); // session is gone
});

test("guest leaving notifies the host", async () => {
  const id = newId();
  const host = await connect(id, "host");
  const guest = await connect(id, "guest");
  assert.equal(await host.next(), "peer-joined");
  guest.close();
  assert.equal(await host.next(), "peer-left");
  host.close();
});

test("3 guest attempts allowed, the 4th destroys the session", async () => {
  const id = newId();
  const host = await connect(id, "host");
  for (let i = 0; i < 3; i++) {
    const guest = await connect(id, "guest");
    assert.equal(await host.next(), "peer-joined");
    guest.close();
    assert.equal(await host.next(), "peer-left");
  }
  await assert.rejects(connect(id, "guest"));
  assert.equal(await host.next(), "session-ended");
});

if (SLOW) {
  test("session expires after ~2 minutes", async () => {
    const host = await connect(newId(), "host");
    assert.equal(await host.next(135_000), "session-ended");
  });
}

let failed = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    console.log(`PASS  ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}
console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
