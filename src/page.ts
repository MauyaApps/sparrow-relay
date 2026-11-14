// Public info page. Deliberately says nothing about how the service is hosted.
export function page(notFound: boolean): string {
  const title = notFound ? "Nothing here" : "Sparrow Relay";
  const lead = notFound
    ? "This address does not serve a page."
    : "Encrypted device-to-device transfer relay.";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
:root{--bg:#06110a;--card:#0b1d12;--line:#16402a;--g:#3ddc84;--dim:#7fae92}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 50% 0,#0e2a19,var(--bg) 60%);color:var(--g);font:16px/1.5 system-ui,Segoe UI,Roboto,sans-serif}
main{width:min(92vw,460px);background:var(--card);border:1px solid var(--line);border-radius:16px;padding:32px;box-shadow:0 0 40px #3ddc8420}
h1{margin:0 0 6px;font-size:28px;letter-spacing:.5px}
p{margin:0 0 20px;color:var(--dim)}
.row{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--line);border-radius:10px;margin-bottom:10px}
.dot{width:10px;height:10px;border-radius:50%;background:var(--dim)}
.ok .dot{background:var(--g);box-shadow:0 0 10px var(--g)}
.bad{color:#ff7a7a}.bad .dot{background:#ff7a7a}
small{display:block;margin-top:18px;color:var(--dim)}
</style></head><body><main>
<h1>${title}</h1><p>${lead}</p>
${notFound ? "" : `<div id="s" class="row"><span class="dot"></span><span id="t">Checking status…</span></div>
<div class="row"><span class="dot" style="background:var(--g)"></span><span>Data is end-to-end encrypted. The relay cannot read it.</span></div>
<div class="row"><span class="dot" style="background:var(--g)"></span><span>Nothing is stored: sessions last up to 2 minutes.</span></div>`}
<small>Sparrow · v1</small>
</main>
<script>
fetch("/health").then(r=>r.text()).then(x=>{
 if(x!=="ok")throw 0;
 document.getElementById("s").classList.add("ok");
 document.getElementById("t").textContent="Online";
}).catch(()=>{
 var s=document.getElementById("s");
 if(s){s.classList.add("bad");document.getElementById("t").textContent="Unavailable"}
});
</script></body></html>`;
}
