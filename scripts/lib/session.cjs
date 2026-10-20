// Test yardımcısı: uygulamayı "oturum açılmış" hâlde açar (yalnızca arayüz testleri için).
// Gerçek giriş yerine yerel bir oturum kaydı enjekte eder; ağ istekleri başarısız olsa da arayüz açılır.
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

// Testler KENDİ profillerinde çalışsın (gerçek uygulama verisine dokunmasın)
try {
  const testProfile = path.join(os.tmpdir(), "bateo-test-profile");
  fs.mkdirSync(testProfile, { recursive: true });
  require("electron").app.setPath("userData", testProfile);
} catch {
  /* yoksay */
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function readEnv() {
  const out = {};
  try {
    const raw = fs.readFileSync(path.join(__dirname, "..", "..", ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].trim();
    }
  } catch {
    /* yok */
  }
  return out;
}

function storageKey() {
  const url = readEnv().VITE_SUPABASE_URL || "";
  let ref = "local";
  try {
    ref = new URL(url).hostname.split(".")[0];
  } catch {
    /* yok */
  }
  return `sb-${ref}-auth-token`;
}

function fakeSession() {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: "test.fake.token",
    token_type: "bearer",
    expires_in: 36000,
    expires_at: now + 36000,
    refresh_token: "test.fake.refresh",
    user: {
      id: "00000000-0000-4000-8000-000000000001",
      aud: "authenticated",
      role: "authenticated",
      email: "test@local",
      app_metadata: {},
      user_metadata: {},
    },
  };
}

/** Profil kurulum modalını atlamak için settings.onboarded = true yazar */
async function markOnboarded(win) {
  await win.webContents.executeJavaScript(`(async () => {
    const open = () => new Promise((res, rej) => { const r = indexedDB.open('bateo'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const db = await open();
    const get = () => new Promise((res) => { const t = db.transaction(['settings'], 'readonly'); const r = t.objectStore('settings').get('app'); r.onsuccess = () => res(r.result); });
    const put = (o) => new Promise((res) => { const t = db.transaction(['settings'], 'readwrite'); t.objectStore('settings').put(o); t.oncomplete = () => res(); });
    const s = (await get()) || { id: 'app' };
    s.onboarded = true;
    await put(s);
    db.close();
    return true;
  })()`);
}

/**
 * Uygulamayı açar, oturumu enjekte eder ve istenen sayfaya gider.
 * @param win BrowserWindow
 * @param appUrl app://bateo/index.html
 * @param opts  { hash?: string, onboarded?: boolean }
 */
async function openAppAsUser(win, appUrl, opts = {}) {
  const { hash = "#/", onboarded = true } = opts;
  await win.loadURL(appUrl);
  await wait(1500);
  if (onboarded) await markOnboarded(win);
  await win.webContents.executeJavaScript(
    `localStorage.setItem(${JSON.stringify(storageKey())}, ${JSON.stringify(JSON.stringify(fakeSession()))}); true;`,
  );
  await win.webContents.executeJavaScript(`location.hash = ${JSON.stringify(hash)}; true;`);
  win.webContents.reload();
  await wait(2800);
}

module.exports = { openAppAsUser, storageKey, markOnboarded, fakeSession, wait };
