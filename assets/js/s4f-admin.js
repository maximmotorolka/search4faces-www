/* s4f-admin.js — admin panel for the search4faces mirror (static site, client-side only) */
(function () {
  "use strict";

  // ---------- SHA-256 (tested: FIPS vectors + .NET cross-check) ----------
  function sha256(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var mp = Math.pow, mw = mp(2, 32), i, j, result = "";
    var asciiBit = unescape(encodeURIComponent(ascii));
    var bytes = []; for (i = 0; i < asciiBit.length; i++) bytes.push(asciiBit.charCodeAt(i));
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (i = 0; i < 4; i++) bytes.push((((bitLen / mw) >>> 0) >>> (8 * (3 - i))) & 255);
    for (i = 0; i < 4; i++) bytes.push((bitLen >>> (8 * (3 - i))) & 255);
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    for (i = 0; i < bytes.length; i += 64) {
      var w = [];
      for (j = 0; j < 16; j++) w[j] = bytes[i + j * 4] << 24 | bytes[i + j * 4 + 1] << 16 | bytes[i + j * 4 + 2] << 8 | bytes[i + j * 4 + 3];
      for (j = 16; j < 64; j++) {
        var s0 = ((rr(w[j - 15], 7) ^ rr(w[j - 15], 18) ^ (w[j - 15] >>> 3)) >>> 0);
        var s1 = ((rr(w[j - 2], 17) ^ rr(w[j - 2], 19) ^ (w[j - 2] >>> 10)) >>> 0);
        w[j] = ((s0 + w[j - 7] + s1 + w[j - 16]) >>> 0);
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (j = 0; j < 64; j++) {
        var T1 = (h + ((rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) >>> 0) + ((e & f) ^ (~e & g)) + K[j] + w[j]) >>> 0;
        var T2 = (((rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) >>> 0) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        h = g; g = f; f = e; e = (d + T1) >>> 0; d = c; c = b; b = a; a = (T1 + T2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    var HEX = "0123456789abcdef";
    for (i = 0; i < 8; i++) for (j = 7; j >= 0; j--) result += HEX[((H[i] >>> (j * 4)) & 15)];
    return result;
  }

  var ADM_USER = "admin";
  var ADM_HASH = "edc6061065cdbdcdabbe787e25169b7a9d23d812452ccfab85b863cb5d3beb92"; // sha256(maximBABAIKA1980)
  var CFG_KEY = "s4f_cfg_v1";
  var SESS_KEY = "s4f_adm_v1";

  var DEF = {
    logo: "search4faces",
    meta: "",
    heroTitle: "Добро пожаловать",
    heroText: "",
    heroText2: "",
    email: "search4faces@gmail.com",
    copyright: "search4faces.com",
    announce: "",
    scripts: []
  };

  function loadCfg() {
    try {
      var raw = localStorage.getItem(CFG_KEY);
      if (!raw) return Object.assign({}, DEF);
      var c = JSON.parse(raw);
      var out = Object.assign({}, DEF, c);
      if (!out.scripts) out.scripts = [];
      return out;
    } catch (e) { return Object.assign({}, DEF); }
  }
  var CFG = loadCfg();

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function runScript(code) {
    try {
      var s = document.createElement("script");
      s.appendChild(document.createTextNode(code));
      document.body.appendChild(s);
    } catch (e) { /* ignore */ }
  }

  // ---------- apply config (runs at DOMContentLoaded) ----------
  function applyCfg() {
    try {
      if (CFG.logo && CFG.logo !== DEF.logo) {
        document.title = document.title.replace("search4faces", CFG.logo);
      }
      if (CFG.meta) {
        var m = document.querySelector('meta[name="description"]');
        if (m) m.setAttribute("content", CFG.meta);
      }
      var logoEl = document.querySelector(".s4f-logo");
      if (logoEl) logoEl.textContent = CFG.logo || DEF.logo;
      var h1 = document.getElementById("s4f-hero-title");
      if (h1) h1.textContent = CFG.heroTitle || DEF.heroTitle;
      var p1 = document.getElementById("s4f-hero-text");
      if (p1 && CFG.heroText) p1.textContent = CFG.heroText;
      var p2 = document.getElementById("s4f-hero-text2");
      if (p2 && CFG.heroText2) p2.textContent = CFG.heroText2;
      var mails = document.querySelectorAll(".s4f-email-link");
      for (var i = 0; i < mails.length; i++) {
        mails[i].textContent = CFG.email || DEF.email;
        mails[i].setAttribute("href", "mailto:" + (CFG.email || DEF.email));
      }
      var cr = document.getElementById("s4f-copyright");
      if (cr) cr.textContent = CFG.copyright || DEF.copyright;
      if (CFG.announce && sessionStorage.getItem("s4f_ann_off") !== "1") {
        var bar = document.createElement("div");
        bar.id = "s4f-announce";
        bar.style.cssText = "position:relative;z-index:1050;background:#111;color:#fff;text-align:center;padding:10px 44px 10px 16px;font-size:14px";
        bar.innerHTML = esc(CFG.announce) + '<a href="#" id="s4f-ann-off" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#888;font-size:18px;text-decoration:none">&times;</a>';
        var header = document.getElementById("header");
        if (header && header.parentNode) header.parentNode.insertBefore(bar, header.nextSibling);
        var off = document.getElementById("s4f-ann-off");
        if (off) off.onclick = function (e) {
          e.preventDefault();
          bar.parentNode && bar.parentNode.removeChild(bar);
          try { sessionStorage.setItem("s4f_ann_off", "1"); } catch (err) { }
          return false;
        };
      }
      for (var k = 0; k < CFG.scripts.length; k++) {
        if (CFG.scripts[k] && CFG.scripts[k].on && CFG.scripts[k].code) runScript(CFG.scripts[k].code);
      }
    } catch (e) { /* never break the page */ }
  }

  // ---------- admin UI (injected, self-contained) ----------
  function buildUI() {
    var st = document.createElement("style");
    st.textContent =
      ".s4f-adm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:2050;display:none;align-items:center;justify-content:center}" +
      ".s4f-adm-overlay.open{display:flex}" +
      ".s4f-adm-box{background:#1e1e24;color:#e8e8e8;width:92%;max-width:560px;max-height:86vh;overflow:auto;border-radius:12px;padding:20px 22px;font-family:'Open Sans',Arial,sans-serif;font-size:14px}" +
      ".s4f-adm-box h3{margin:0 0 14px;font-size:18px}" +
      ".s4f-adm-box label{display:block;margin:10px 0 4px;color:#aaa;font-size:12px}" +
      ".s4f-adm-box input[type=text],.s4f-adm-box input[type=password],.s4f-adm-box textarea{width:100%;box-sizing:border-box;background:#12121a;border:1px solid #333;border-radius:6px;color:#eee;padding:7px 9px;font-size:13px;font-family:inherit}" +
      ".s4f-adm-box textarea{min-height:64px;resize:vertical;font-family:Consolas,monospace;font-size:12px}" +
      ".s4f-adm-btns{margin-top:14px;display:flex;gap:8px;flex-wrap:wrap}" +
      ".s4f-adm-btns button{background:#3b82f6;border:none;color:#fff;border-radius:6px;padding:8px 14px;cursor:pointer;font-size:13px}" +
      ".s4f-adm-btns button.gray{background:#374151}" +
      ".s4f-adm-err{color:#f87171;min-height:18px;margin-top:8px}" +
      ".s4f-scr-row{border:1px solid #333;border-radius:8px;padding:8px;margin-top:8px;display:flex;gap:8px;align-items:flex-start}" +
      ".s4f-scr-row textarea{flex:1;min-height:48px}";
    document.head.appendChild(st);

    var ov = document.createElement("div");
    ov.className = "s4f-adm-overlay";
    ov.id = "s4fAdmOv";
    ov.innerHTML =
      '<div class="s4f-adm-box">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<h3>⚙ Админка</h3><a href="#" id="s4fAdmX" style="color:#888;font-size:22px;text-decoration:none">&times;</a></div>' +
      '<div id="s4fAdmLogin">' +
      '<label>Логин</label><input type="text" id="s4fAdmUser" autocomplete="off">' +
      '<label>Пароль</label><input type="password" id="s4fAdmPass" autocomplete="off">' +
      '<div class="s4f-adm-err" id="s4fAdmErr"></div>' +
      '<div class="s4f-adm-btns"><button id="s4fAdmLoginBtn">Войти</button></div>' +
      '</div>' +
      '<div id="s4fAdmPanel" style="display:none">' +
      '<label>Название (лого и заголовок страницы)</label><input type="text" id="s4fCfgLogo">' +
      '<label>Meta description (пусто = как на сайте)</label><input type="text" id="s4fCfgMeta">' +
      '<label>Заголовок на главной</label><input type="text" id="s4fCfgHeroTitle">' +
      '<label>Текст 1 (пусто = как на сайте)</label><textarea id="s4fCfgHeroText"></textarea>' +
      '<label>Текст 2 (пусто = как на сайте)</label><textarea id="s4fCfgHeroText2"></textarea>' +
      '<label>Email (блок «О сервисе» и футер)</label><input type="text" id="s4fCfgEmail">' +
      '<label>Copyright (футер)</label><input type="text" id="s4fCfgCr">' +
      '<label>Анонс (баннер под шапкой, пусто = скрыт)</label><textarea id="s4fCfgAnnounce"></textarea>' +
      '<label>Скрипты (автозапуск при загрузке, если включены)</label>' +
      '<div id="s4fScrList"></div>' +
      '<div class="s4f-adm-btns"><button class="gray" id="s4fScrAdd">+ Добавить скрипт</button></div>' +
      '<div class="s4f-adm-btns">' +
      '<button id="s4fAdmSave">Сохранить</button>' +
      '<button class="gray" id="s4fAdmReset">Сбросить настройки</button>' +
      '<button class="gray" id="s4fAdmLogout">Выйти</button>' +
      '</div>' +
      '</div>' +
      '</div>';
    document.body.appendChild(ov);

    var btn = document.getElementById("s4fAdmBtn");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "s4fAdmBtn";
      btn.title = "Админка";
      btn.textContent = "⚙";
      btn.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:2040;width:40px;height:40px;border-radius:50%;border:none;background:rgba(0,0,0,.55);color:#fff;font-size:18px;cursor:pointer";
      document.body.appendChild(btn);
    }
    var footLink = document.getElementById("s4fAdmFoot");
    if (footLink) footLink.onclick = openAdm;
    btn.onclick = openAdm;

    function openAdm() {
      ov.classList.add("open");
      if (sessionStorage.getItem(SESS_KEY) === "1") {
        showPanel();
      } else {
        el("s4fAdmLogin").style.display = "block";
        el("s4fAdmPanel").style.display = "none";
        el("s4fAdmErr").textContent = "";
        el("s4fAdmUser").value = "";
        el("s4fAdmPass").value = "";
      }
    }
    function closeAdm() { ov.classList.remove("open"); }
    function el(id) { return document.getElementById(id); }

    el("s4fAdmX").onclick = function (e) { e.preventDefault(); closeAdm(); };
    ov.onclick = function (e) { if (e.target === ov) closeAdm(); };

    el("s4fAdmLoginBtn").onclick = function () {
      if (el("s4fAdmUser").value.trim() === ADM_USER && sha256(el("s4fAdmPass").value) === ADM_HASH) {
        sessionStorage.setItem(SESS_KEY, "1");
        el("s4fAdmErr").textContent = "";
        showPanel();
      } else {
        el("s4fAdmErr").textContent = "Неверный логин или пароль";
      }
    };
    el("s4fAdmPass").onkeydown = function (e) { if (e.key === "Enter") el("s4fAdmLoginBtn").click(); };

    function renderScripts() {
      var list = el("s4fScrList");
      list.innerHTML = "";
      CFG.scripts.forEach(function (s, idx) {
        var row = document.createElement("div");
        row.className = "s4f-scr-row";
        var ta = document.createElement("textarea");
        ta.value = s.code || "";
        ta.onchange = function () { CFG.scripts[idx].code = ta.value; };
        var btns = document.createElement("div");
        btns.style.cssText = "display:flex;flex-direction:column;gap:6px";
        var runB = document.createElement("button");
        runB.textContent = "▶ сейчас";
        runB.style.cssText = "background:#059669;border:none;color:#fff;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:12px";
        runB.onclick = function () { runScript(ta.value); };
        var onC = document.createElement("label");
        onC.style.cssText = "display:flex;align-items:center;gap:4px;font-size:12px;color:#ccc;margin:0";
        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!s.on;
        cb.onchange = function () { CFG.scripts[idx].on = cb.checked; };
        onC.appendChild(cb); onC.appendChild(document.createTextNode("авто"));
        var delB = document.createElement("button");
        delB.textContent = "✕ удалить";
        delB.style.cssText = "background:#7f1d1d;border:none;color:#fff;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:12px";
        delB.onclick = function () { CFG.scripts.splice(idx, 1); renderScripts(); };
        btns.appendChild(runB); btns.appendChild(onC); btns.appendChild(delB);
        row.appendChild(ta); row.appendChild(btns);
        list.appendChild(row);
      });
    }

    function showPanel() {
      el("s4fAdmLogin").style.display = "none";
      el("s4fAdmPanel").style.display = "block";
      el("s4fCfgLogo").value = CFG.logo;
      el("s4fCfgMeta").value = CFG.meta || "";
      el("s4fCfgHeroTitle").value = CFG.heroTitle;
      el("s4fCfgHeroText").value = CFG.heroText || "";
      el("s4fCfgHeroText2").value = CFG.heroText2 || "";
      el("s4fCfgEmail").value = CFG.email;
      el("s4fCfgCr").value = CFG.copyright;
      el("s4fCfgAnnounce").value = CFG.announce || "";
      renderScripts();
    }

    el("s4fScrAdd").onclick = function () { CFG.scripts.push({ code: "", on: true }); renderScripts(); };
    el("s4fAdmSave").onclick = function () {
      CFG.logo = el("s4fCfgLogo").value.trim() || DEF.logo;
      CFG.meta = el("s4fCfgMeta").value;
      CFG.heroTitle = el("s4fCfgHeroTitle").value || DEF.heroTitle;
      CFG.heroText = el("s4fCfgHeroText").value;
      CFG.heroText2 = el("s4fCfgHeroText2").value;
      CFG.email = el("s4fCfgEmail").value.trim() || DEF.email;
      CFG.copyright = el("s4fCfgCr").value || DEF.copyright;
      CFG.announce = el("s4fCfgAnnounce").value;
      try { localStorage.setItem(CFG_KEY, JSON.stringify(CFG)); } catch (e) { }
      location.reload();
    };
    el("s4fAdmReset").onclick = function () {
      try { localStorage.removeItem(CFG_KEY); } catch (e) { }
      location.reload();
    };
    el("s4fAdmLogout").onclick = function () {
      try { sessionStorage.removeItem(SESS_KEY); } catch (e) { }
      closeAdm();
    };
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      applyCfg();
      buildUI();
    } catch (e) { /* never break the page */ }
  });
})();
