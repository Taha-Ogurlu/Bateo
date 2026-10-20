// GERÇEK uygulama profilini inceler (test profili kullanmaz, oturum enjekte etmez).
// Yalnızca okuma amaçlıdır; uygulamayı açar ve veritabanı durumunu raporlar.
const os = require("node:os");
const { app, BrowserWindow } = require("electron");
const { registerPrivileged, registerHandler, APP_URL } = require("../electron/app-protocol.cjs");

// Gerçek profil (varsayılan userData) — bilinçli olarak DEĞİŞTİRİLMİYOR
app.disableHardwareAcceleration();
registerPrivileged();

const EXPECTED = [
  "notes", "folders", "tasks", "courses", "classSlots", "focusSessions", "exams", "dayEntries",
  "settings", "outbox", "meta", "decks", "flashcards", "books", "bookQuotes",
];

app.whenReady().then(async () => {
  registerHandler();
  console.log("USER_DATA " + app.getPath("userData"));

  const win = new BrowserWindow({
    show: false,
    width: 1000,
    height: 800,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      preload: require("node:path").join(__dirname, "smoke-preload.cjs"),
    },
  });

  await win.loadURL(APP_URL);
  await new Promise((r) => setTimeout(r, 3000));

  const diag = await win.webContents.executeJavaScript(`(async () => {
    const out = { version: null, stores: [], counts: {}, missing: [], extra: [], errors: [] };
    try {
      const db = await new Promise((res, rej) => {
        const r = indexedDB.open('bateo');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      out.version = db.version;
      out.stores = Array.from(db.objectStoreNames).sort();
      const count = (s) => new Promise((res) => {
        const t = db.transaction([s], 'readonly');
        const r = t.objectStore(s).count();
        r.onsuccess = () => res(r.result);
        r.onerror = () => res('err');
      });
      for (const s of db.objectStoreNames) out.counts[s] = await count(s);
      const expected = ${JSON.stringify(EXPECTED)};
      out.missing = expected.filter((s) => !out.stores.includes(s));
      out.extra = out.stores.filter((s) => !expected.includes(s));
      db.close();
    } catch (e) {
      out.errors.push(String(e && e.message));
    }
    out.appErrors = (window.__BATEO_ERRORS || []).slice(0, 5);
    out.appRendered = (document.getElementById('root') || { children: [] }).children.length > 0;
    out.totalRecords = Object.entries(out.counts)
      .filter(([k]) => k !== 'settings' && k !== 'meta' && k !== 'outbox')
      .reduce((a, [, v]) => a + (typeof v === 'number' ? v : 0), 0);

    // Örnek kayıtlar (başlıklar) — yeni bağlantı ile
    out.samples = {};
    const sdb = await new Promise((res, rej) => { const r = indexedDB.open('bateo'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const sample = (s, fields) => new Promise((res) => {
      try {
        const t = sdb.transaction([s], 'readonly');
        const r = t.objectStore(s).openCursor();
        const rows = [];
        r.onsuccess = () => {
          const c = r.result;
          if (c && rows.length < 5) {
            const o = {};
            for (const f of fields) o[f] = c.value[f];
            rows.push(o);
            c.continue();
          } else res(rows);
        };
        r.onerror = () => res([]);
      } catch { res([]); }
    });
    out.samples.notes = await sample('notes', ['title', 'createdAt']);
    out.samples.tasks = await sample('tasks', ['title']);
    out.samples.books = await sample('books', ['title']);
    out.samples.decks = await sample('decks', ['name']);
    sdb.close();
    return out;
  })()`);

  console.log("REAL_DIAG " + JSON.stringify(diag));
  app.exit(0);
});
