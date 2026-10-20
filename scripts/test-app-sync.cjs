// Uygulama → bulut senkron testi (gerçek giriş akışıyla):
// 1) Supabase'de test hesabı açar
// 2) Uygulamayı açar, tanıtımı atlar, giriş formunu doldurup gönderir
// 3) Yerel bir not oluşturur, yeniden yükleyip otomatik senkronu bekler
// 4) Aynı hesapla buluttan kayıtları okuyup doğrular, temizler
const { app, BrowserWindow } = require("electron");
const { registerPrivileged, registerHandler, APP_URL } = require("../electron/app-protocol.cjs");
const { wait } = require("./lib/session.cjs");
const { readFileSync } = require("node:fs");
const path = require("node:path");

function readEnv() {
  const out = {};
  try {
    const raw = readFileSync(path.join(__dirname, "..", ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].trim();
    }
  } catch {
    /* yok */
  }
  return out;
}

const env = readEnv();
const URL_ = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;

app.disableHardwareAcceleration();
registerPrivileged();

async function main() {
  const email = `bateo-app-${Date.now()}@example.com`;
  const password = `Test-${Math.random().toString(36).slice(2)}A1`;

  // 1) Hesap aç
  const upRes = await fetch(`${URL_}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const up = await upRes.json();
  if (!up.access_token) {
    console.log("APP_SYNC_RESULT " + JSON.stringify({ ok: false, step: "signup", detail: up }));
    return app.exit(1);
  }
  const token = up.access_token;

  const win = new BrowserWindow({
    show: false,
    width: 1000,
    height: 900,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      preload: path.join(__dirname, "smoke-preload.cjs"),
    },
  });

  // 2) Temiz başlangıç → kapı
  await win.loadURL(APP_URL);
  await win.webContents.executeJavaScript("localStorage.clear(); true;");
  win.webContents.reload();
  await wait(2400);

  // Tanıtımı atla
  await win.webContents.executeJavaScript(`(() => {
    const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Atla');
    if (b) b.click();
    return !!b;
  })()`);
  await wait(1800);

  // Giriş moduna geç (hesap Node tarafında açıldı)
  await win.webContents.executeJavaScript(`(() => {
    const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Giriş yap');
    if (b) b.click();
    return !!b;
  })()`);
  await wait(700);

  // Giriş formunu doldur
  const login = await win.webContents.executeJavaScript(`(() => {
    const setNative = (el, val) => {
      const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      s.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const emailEl = document.querySelector('input[type="email"]');
    const passEl = document.querySelector('input[type="password"]');
    if (!emailEl || !passEl) return { ok: false, reason: 'form yok' };
    setNative(emailEl, ${JSON.stringify(email)});
    setNative(passEl, ${JSON.stringify(password)});
    const btn = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Giriş yap');
    if (!btn) return { ok: false, reason: 'buton yok' };
    btn.click();
    return { ok: true };
  })()`);

  await wait(6000);

  const afterLogin = await win.webContents.executeJavaScript(`(() => {
    const txt = document.body.innerText || '';
    return {
      snippet: txt.replace(/\\s+/g, ' ').slice(0, 220),
      hasEmailInput: !!document.querySelector('input[type="email"]'),
      appOpen: txt.includes('Ana Sayfa'),
    };
  })()`);
  console.log("APP_SYNC_AFTERLOGIN " + JSON.stringify(afterLogin));

  // 3) Yerel bir not oluştur, sonra yeniden yükle (otomatik senkron tetiklensin)
  await win.webContents.executeJavaScript(`location.hash = "#/notlar?new=1"; true;`);
  await wait(3000);
  await win.webContents.executeJavaScript(`(() => { const pm = document.querySelector('.ProseMirror'); return !!pm; })()`);
  win.webContents.reload();
  await wait(7000);

  const ui = await win.webContents.executeJavaScript(`(() => {
    const txt = document.body.innerText || '';
    return {
      appOpen: txt.includes('Ana Sayfa'),
      gate: txt.includes('Hesap oluştur') && !!document.querySelector('input[type="email"]'),
      errors: (window.__BATEO_ERRORS || []).slice(0, 3),
    };
  })()`);

  // 4) Buluttan oku
  const listRes = await fetch(`${URL_}/rest/v1/records?select=doc_id,table_name,deleted`, {
    headers: { apikey: KEY, Authorization: `Bearer ${token}` },
  });
  const body = await listRes.text();
  let rows = [];
  try {
    rows = JSON.parse(body);
  } catch {
    rows = [];
  }
  const count = Array.isArray(rows) ? rows.length : -1;

  await fetch(`${URL_}/rest/v1/records`, {
    method: "DELETE",
    headers: { apikey: KEY, Authorization: `Bearer ${token}`, Prefer: "return=minimal" },
  });

  console.log("APP_SYNC_LOGIN " + JSON.stringify(login));
  console.log("APP_SYNC_UI " + JSON.stringify(ui));
  console.log("APP_SYNC_HTTP " + JSON.stringify({ status: listRes.status, count }));
  console.log("APP_SYNC_RESULT " + JSON.stringify({ ok: count > 0, cloudRows: count, account: email.replace(/@.*/, "@…") }));
  app.exit(count > 0 ? 0 : 1);
}

app.whenReady().then(() => {
  registerHandler();
  main().catch((e) => {
    console.log("APP_SYNC_RESULT " + JSON.stringify({ ok: false, error: String(e && e.message) }));
    app.exit(1);
  });
});
