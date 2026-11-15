import { DurableObject } from "cloudflare:workers";
import { page } from "./page";

interface Env {
  SESSION: DurableObjectNamespace;
  LIMIT_SESSION: RateLimit; // per-IP limit for long-id sessions
  LIMIT_CODE: RateLimit; // stricter per-IP limit for short-code sessions
}

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "content-security-policy":
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "cache-control": "no-store",
};
const html = (notFound: boolean) =>
  new Response(page(notFound), { status: notFound ? 404 : 200, headers: HTML_HEADERS });

const ID_RE = /^[A-Za-z0-9_-]{22,64}$/;
const CODE_RE = /^[0-9]{3}$/; // short session number used by the 7-digit code flow
const MAX_MESSAGE_BYTES = 2 * 1024 * 1024; // limit for one encrypted message
const SESSION_TTL_MS = 120_000; // session lives 2 minutes
const MAX_GUEST_JOINS = 3; // connection attempts by the second device

type Role = "host" | "guest";

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/health") return new Response("ok");
    if (url.pathname === "/") return html(false);

    const m = url.pathname.match(/^\/v1\/(session|code)\/([^/]+)$/);
    const kind = m?.[1];
    const key = m?.[2] ?? "";
    const valid = kind === "code" ? CODE_RE.test(key) : kind === "session" && ID_RE.test(key);
    if (!m || !valid) {
      return req.headers.get("Upgrade") === "websocket"
        ? new Response("not found", { status: 404 })
        : html(true);
    }

    // Per-IP rate limit (counted per Cloudflare location, so approximate).
    const ip = req.headers.get("cf-connecting-ip") ?? "local";
    const limiter = kind === "code" ? env.LIMIT_CODE : env.LIMIT_SESSION;
    const { success } = await limiter.limit({ key: ip });
    if (!success) {
      return new Response("too many requests", { status: 429, headers: { "retry-after": "60" } });
    }

    if (req.headers.get("Upgrade") !== "websocket") {
      return new Response("websocket required", { status: 426 });
    }
    const role = url.searchParams.get("role");
    if (role !== "host" && role !== "guest") {
      return new Response("bad request", { status: 400 });
    }

    // Short codes live in their own namespace ("code:" cannot occur in a long id).
    const name = kind === "code" ? `code:${key}` : key;
    const stub = env.SESSION.get(env.SESSION.idFromName(name));
    return stub.fetch(req);
  },
};

/**
 * One transfer session = one Session object.
 * - "host" creates the session, "guest" joins it.
 * - Only binary frames are relayed (opaque ciphertext / PAKE messages).
 * - Text frames are sent only by the relay: "peer-joined", "peer-left",
 *   "session-ended" (sent right before the relay closes the socket).
 * - Nothing is logged or persisted except expiry time and join counter.
 */
export class Session extends DurableObject<Env> {
  async fetch(req: Request): Promise<Response> {
    const role = new URL(req.url).searchParams.get("role") as Role;
    const now = Date.now();

    let expires = await this.ctx.storage.get<number>("expires");

    if (expires === undefined) {
      // Only the host can create a session.
      if (role !== "host") return new Response("not found", { status: 404 });
      expires = now + SESSION_TTL_MS;
      await this.ctx.storage.put({ expires, joins: 0 });
      await this.ctx.storage.setAlarm(expires);
    } else if (now >= expires) {
      await this.destroy("expired");
      return new Response("not found", { status: 404 });
    }

    if (this.ctx.getWebSockets(role).length > 0) {
      return new Response("role already taken", { status: 409 });
    }

    if (role === "guest") {
      const joins = (await this.ctx.storage.get<number>("joins")) ?? 0;
      if (joins >= MAX_GUEST_JOINS) {
        await this.destroy("too many attempts");
        return new Response("too many attempts", { status: 429 });
      }
      await this.ctx.storage.put("joins", joins + 1);
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [role]);

    if (role === "guest") {
      this.ctx.getWebSockets("host")[0]?.send("peer-joined");
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // Clients may only send binary frames.
    if (typeof message === "string") {
      ws.close(1003, "binary only");
      return;
    }
    if (message.byteLength > MAX_MESSAGE_BYTES) {
      ws.close(1009, "message too large");
      return;
    }

    const role = this.ctx.getTags(ws)[0] as Role;
    const peer = this.ctx.getWebSockets(role === "host" ? "guest" : "host")[0];
    if (!peer) {
      ws.close(1008, "no peer");
      return;
    }
    peer.send(message);
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const role = this.ctx.getTags(ws)[0] as Role;
    try {
      ws.close(1000, "closed");
    } catch {
      /* already closed */
    }
    if (role === "host") {
      // The host owns the session: when it leaves, the session ends.
      await this.destroy("host left");
    } else {
      this.ctx.getWebSockets("host")[0]?.send("peer-left");
    }
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  async alarm(): Promise<void> {
    await this.destroy("expired");
  }

  private async destroy(reason: string): Promise<void> {
    for (const ws of this.ctx.getWebSockets()) {
      try {
        // Tell the client explicitly, then close. Clients rely on this frame.
        ws.send("session-ended");
        ws.close(1000, reason);
      } catch {
        /* already closed */
      }
    }
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }
}
