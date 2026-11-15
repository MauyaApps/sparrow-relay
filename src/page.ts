// Public site. Everything is inline (no external requests) and says nothing about hosting.
const CSS = `
:root{--bg:#06110a;--card:#0b1d12;--line:#16402a;--g:#3ddc84;--g2:#9af0bd;--dim:#86b79a;--txt:#d9f5e4}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:radial-gradient(circle at 50% -10%,#0e2a19,var(--bg) 55%) fixed;color:var(--txt);font:16px/1.6 system-ui,Segoe UI,Roboto,sans-serif}
html[lang=ru] [data-l=en],html[lang=en] [data-l=ru]{display:none}
.w{width:min(94vw,980px);margin:0 auto}
header{display:flex;align-items:center;justify-content:space-between;padding:22px 0}
.logo{font-weight:700;font-size:22px;color:var(--g);letter-spacing:.5px;display:flex;align-items:center;gap:10px}
.logo i{width:12px;height:12px;border-radius:50%;background:var(--g);box-shadow:0 0 14px var(--g)}
.lang button{background:none;border:1px solid var(--line);color:var(--dim);padding:5px 12px;cursor:pointer;font:inherit;font-size:14px}
.lang button:first-child{border-radius:8px 0 0 8px}.lang button:last-child{border-radius:0 8px 8px 0;border-left:0}
html[lang=ru] .lang [data-set=ru],html[lang=en] .lang [data-set=en]{background:var(--g);color:#04200f;border-color:var(--g)}
.hero{padding:40px 0 26px;text-align:center}
h1{margin:0 0 12px;font-size:clamp(30px,6vw,48px);line-height:1.15;color:var(--g)}
h2{margin:0 0 6px;font-size:26px;color:var(--g)}h3{margin:0 0 8px;font-size:19px;color:var(--g2)}
.lead{max-width:640px;margin:0 auto 22px;color:var(--dim);font-size:18px}
.pill{display:inline-flex;align-items:center;gap:9px;border:1px solid var(--line);border-radius:99px;padding:7px 16px;background:var(--card);margin:4px}
.dot{width:10px;height:10px;border-radius:50%;background:var(--dim)}
.ok .dot{background:var(--g);box-shadow:0 0 10px var(--g)}.bad .dot{background:#ff7a7a}
section{padding:34px 0}.sub{color:var(--dim);margin:0 0 22px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:18px}
.g4{grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px;box-shadow:0 0 36px #3ddc8414}
.card svg{width:100%;height:auto;margin-bottom:12px;border-radius:10px;background:#071a0f}
.tag{display:inline-block;font-size:12px;border:1px solid var(--g);color:var(--g);border-radius:99px;padding:1px 10px;margin-left:8px;vertical-align:middle}
ol{margin:0;padding-left:0;list-style:none;counter-reset:s}
ol li{counter-increment:s;position:relative;padding:8px 0 8px 40px}
ol li:before{content:counter(s);position:absolute;left:0;top:7px;width:28px;height:28px;border-radius:50%;background:var(--g);color:#04200f;font-weight:700;display:grid;place-items:center}
.note{border-left:3px solid var(--g);background:#0a2415;padding:12px 16px;border-radius:0 10px 10px 0;margin-top:14px;color:var(--g2)}
.card p{margin:0;color:var(--dim)}
details{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin-bottom:10px}
summary{cursor:pointer;color:var(--g2);font-weight:600}details p{margin:10px 0 0;color:var(--dim)}
footer{padding:30px 0 50px;text-align:center;color:var(--dim);font-size:14px;border-top:1px solid var(--line)}
.nf{min-height:100vh;display:grid;place-items:center;text-align:center}
`;

// Illustrations (inline SVG, no external files)
const QR = [[0,0],[1,0],[2,0],[4,0],[0,1],[2,1],[3,1],[0,2],[1,2],[2,2],[4,2],[3,3],[4,4],[1,4],[2,4],[0,4],[4,3]]
  .map(([x, y]) => `<rect x="${x * 8}" y="${y * 8}" width="7" height="7"/>`).join("");
const SVG_QR = `<svg viewBox="0 0 400 190" role="img" aria-label="QR"><g fill="none" stroke="#3ddc84" stroke-width="2"><rect x="25" y="25" width="150" height="100" rx="8"/><path d="M100 125v25M70 150h60"/><rect x="290" y="30" width="70" height="135" rx="12"/></g><g fill="#3ddc84" transform="translate(70 45)">${QR}</g><path d="M190 80h80M258 68l14 12-14 12" fill="none" stroke="#9af0bd" stroke-width="3" stroke-linecap="round"/><g fill="none" stroke="#9af0bd" stroke-width="2"><path d="M302 62v-10h10M348 62v-10h-10M302 100v10h10M348 100v10h-10"/></g><circle cx="325" cy="148" r="4" fill="#3ddc84"/></svg>`;
const SVG_CODE = `<svg viewBox="0 0 400 190" role="img" aria-label="Code"><g fill="none" stroke="#3ddc84" stroke-width="2"><rect x="30" y="25" width="70" height="140" rx="12"/><rect x="230" y="25" width="150" height="100" rx="8"/><path d="M305 125v25M275 150h60"/></g><text x="65" y="92" font-family="monospace" font-size="15" fill="#9af0bd" text-anchor="middle">483 7192</text><path d="M118 82h90M196 70l14 12-14 12" fill="none" stroke="#9af0bd" stroke-width="3" stroke-linecap="round"/><g fill="none" stroke="#3ddc84" stroke-width="2"><rect x="250" y="62" width="16" height="24" rx="4"/><rect x="272" y="62" width="16" height="24" rx="4"/><rect x="294" y="62" width="16" height="24" rx="4"/><rect x="322" y="62" width="16" height="24" rx="4"/><rect x="344" y="62" width="16" height="24" rx="4"/></g><g fill="#9af0bd" font-family="monospace" font-size="16" text-anchor="middle"><text x="258" y="80">4</text><text x="280" y="80">8</text><text x="302" y="80">3</text><text x="330" y="80">7</text></g></svg>`;

const t = (ru: string, en: string) => `<span data-l="ru">${ru}</span><span data-l="en">${en}</span>`;

const SCRIPT = `
(function(){
var d=document.documentElement,T={ru:"Sparrow — безопасный перенос паролей",en:"Sparrow — secure password transfer"};
function set(l){d.lang=l;document.title=T[l];try{localStorage.setItem("sl",l)}catch(e){}}
var l="";try{l=localStorage.getItem("sl")||""}catch(e){}
if(l!=="ru"&&l!=="en")l=(navigator.language||"").slice(0,2)==="ru"?"ru":"en";
set(l);
document.querySelectorAll("[data-set]").forEach(function(b){b.addEventListener("click",function(){set(b.getAttribute("data-set"))})});
var s=document.getElementById("s"),x=document.getElementById("st");
fetch("/health").then(function(r){return r.text()}).then(function(v){if(v!=="ok")throw 0;s.className="pill ok";x.dataset.on="1";document.getElementById("on").hidden=false;document.getElementById("chk").hidden=true})
.catch(function(){s.className="pill bad";document.getElementById("chk").hidden=true;document.getElementById("off").hidden=false});
})();`;

export function page(notFound: boolean): string {
  const head = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark">
<title>Sparrow</title><style>${CSS}</style></head><body>`;
  if (notFound) {
    return `${head}<main class="nf w"><div><h1>404</h1><p class="lead">${t("Здесь ничего нет.", "Nothing here.")}</p><p><a style="color:var(--g)" href="/">Sparrow</a></p></div></main></body></html>`;
  }
  return `${head}
<div class="w">
<header><div class="logo"><i></i>Sparrow</div><div class="lang"><button data-set="ru">RU</button><button data-set="en">EN</button></div></header>

<div class="hero">
<h1>${t("Перенос паролей между вашими устройствами", "Move your passwords between your devices")}</h1>
<p class="lead">${t("Сквозное шифрование: данные расшифровываете только вы. Сервис лишь передаёт зашифрованные байты и ничего не хранит.", "End-to-end encrypted: only you can read your data. The service only forwards encrypted bytes and stores nothing.")}</p>
<span id="s" class="pill"><span class="dot"></span><span id="st"><span id="chk">${t("Проверка…", "Checking…")}</span><span id="on" hidden>${t("Сервис работает", "Service online")}</span><span id="off" hidden>${t("Сервис недоступен", "Service unavailable")}</span></span></span>
<span class="pill"><span class="dot" style="background:var(--g)"></span>${t("Приложения Sparrow в разработке", "Sparrow apps are in development")}</span>
</div>

<section id="how">
<h2>${t("Как проходит перенос", "How a transfer works")}</h2>
<p class="sub">${t("Устройство с паролями показывает QR-код или код из 7 цифр. Новое устройство сканирует его или вводит. Переносится уже зашифрованное хранилище, а мастер-пароль не передаётся никогда.", "The device that has your passwords shows a QR code or a 7-digit code. The new device scans or types it. Your vault travels already encrypted, and your master password is never sent.")}</p>
<div class="grid">
<div class="card">${SVG_QR}
<h3>${t("Вариант 1: QR-код", "Option 1: QR code")}<span class="tag">${t("рекомендуем", "recommended")}</span></h3>
<ol>
<li>${t("На устройстве с паролями откройте Sparrow → Перенос → Отправить → QR-код.", "On the device with your passwords open Sparrow → Transfer → Send → QR code.")}</li>
<li>${t("Появится QR-код. Он действует 2 минуты.", "A QR code appears. It is valid for 2 minutes.")}</li>
<li>${t("На новом устройстве откройте Sparrow → Перенос → Получить → Сканировать QR и наведите камеру на экран.", "On the new device open Sparrow → Transfer → Receive → Scan QR and point the camera at the screen.")}</li>
<li>${t("Подождите несколько секунд. Хранилище придёт зашифрованным, и вы откроете его мастер-паролем.", "Wait a few seconds. The vault arrives encrypted and you unlock it with your master password.")}</li>
</ol></div>
<div class="card">${SVG_CODE}
<h3>${t("Вариант 2: код из 7 цифр", "Option 2: 7-digit code")}</h3>
<ol>
<li>${t("На устройстве с паролями откройте Sparrow → Перенос → Отправить → Код. Появится 7 цифр.", "On the device with your passwords open Sparrow → Transfer → Send → Code. Seven digits appear.")}</li>
<li>${t("На новом устройстве откройте Sparrow → Перенос → Получить → Ввести код и наберите 7 цифр.", "On the new device open Sparrow → Transfer → Receive → Enter code and type the 7 digits.")}</li>
<li>${t("Сравните 4 цифры проверки на обоих экранах. Если совпали, подтвердите.", "Compare the 4-digit check on both screens. If they match, confirm.")}</li>
<li>${t("Дождитесь окончания. Код одноразовый и действует 2 минуты.", "Wait for it to finish. The code works once and expires in 2 minutes.")}</li>
</ol>
<div class="note">${t("Код проще набрать, но он слабее QR. Если на устройстве есть камера, выбирайте QR.", "A code is easier to type but weaker than a QR. If a camera is available, choose the QR.")}</div></div>
</div>
</section>

<section>
<h2>${t("Почему это безопасно", "Why it is safe")}</h2>
<p class="sub">${t("Мы не просим доверять сервису: он технически не может прочитать ваши данные.", "You do not have to trust the service: it technically cannot read your data.")}</p>
<div class="grid g4">
<div class="card"><h3>${t("Сквозное шифрование", "End-to-end encryption")}</h3><p>${t("Ключи есть только у двух ваших устройств.", "Only your two devices hold the keys.")}</p></div>
<div class="card"><h3>${t("Ничего не хранится", "Nothing is stored")}</h3><p>${t("Сессия живёт до 2 минут и исчезает после переноса.", "A session lasts up to 2 minutes and disappears after the transfer.")}</p></div>
<div class="card"><h3>${t("Защита от подбора", "Guess protection")}</h3><p>${t("Одна попытка на сессию, лимиты запросов, современный протокол PAKE для кода.", "One guess per session, request limits and a modern PAKE protocol for codes.")}</p></div>
<div class="card"><h3>${t("Двойная защита", "Double layer")}</h3><p>${t("Хранилище остаётся зашифрованным мастер-паролем и во время переноса.", "The vault stays encrypted with your master password during the transfer too.")}</p></div>
</div>
</section>

<section>
<h2>${t("Если что-то пошло не так", "If something goes wrong")}</h2>
<p class="sub"></p>
<details><summary>${t("Код или QR перестал работать", "The code or QR stopped working")}</summary><p>${t("Они действуют 2 минуты и только один раз. Начните перенос заново на устройстве-отправителе.", "They are valid for 2 minutes and only once. Start the transfer again on the sending device.")}</p></details>
<details><summary>${t("Я ошибся при вводе кода", "I mistyped the code")}</summary><p>${t("После неудачной попытки сессия закрывается ради безопасности. Создайте новый код и введите его заново.", "After a failed attempt the session closes for safety. Create a new code and enter it again.")}</p></details>
<details><summary>${t("Цифры проверки не совпадают", "The check digits do not match")}</summary><p>${t("Откажитесь от переноса и начните заново. Если повторится, смените сеть.", "Decline the transfer and start again. If it repeats, switch to another network.")}</p></details>
<details><summary>${t("Не удаётся подключиться", "Cannot connect")}</summary><p>${t("Проверьте интернет на обоих устройствах. В некоторых сетях сервис может быть недоступен: попробуйте другую сеть или VPN.", "Check the internet on both devices. Some networks may block the service: try another network or a VPN.")}</p></details>
<details><summary>${t("Нужен ли аккаунт?", "Do I need an account?")}</summary><p>${t("Нет. Перенос работает без регистрации.", "No. Transfer works without signing up.")}</p></details>
<details><summary>${t("Отправляется ли мастер-пароль?", "Is my master password sent?")}</summary><p>${t("Никогда. Передаётся только зашифрованное хранилище.", "Never. Only the encrypted vault is sent.")}</p></details>
</section>

<footer>Sparrow · v1</footer>
</div>
<script>${SCRIPT}</script></body></html>`;
}
