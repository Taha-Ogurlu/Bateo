// Yerel veritabanı teşhisi: şema sürümü, tablolar ve kayıt sayıları.
const { app, BrowserWindow } = require("electron");
const { registerPrivileged, registerHandler, APP_URL } = require("../electron/app-protocol.cjs");
const { openAppAsUser } = require("./lib/session.cjs");

const EXPECTED = [
  "notes", "folders", "tasks", "courses", "classSlots", "focusSessions", "exams", "dayEntries",
  "settings", "outbox", "meta", "decks", "flashcards", "books", "bookQuotes",
];

app.disableHardwareAcceleration();
registerPrivileged();

app.whenReady().then(async () => {
  registerHandler();
  const win = new BrowserWindow({
    show: false,
    width: 1100,
    height: 820,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      preload: require("node:path").join(__dirname, "smoke-preload.cjs"),
    },
  });

  await openAppAsUser(win, APP_URL, { hash: "#/", onboarded: true });
  await new Promise((r) => setTimeout(r, 2000));

  const diag = await win.webContents.executeJavaScript(`(async () => {
    const out = { databases: [], version: null, stores: [], counts: {}, missing: [], extra: [], errors: [] };
    try {
      if (indexedDB.databases) {
        const list = await indexedDB.databases();
        out.databases = list.map((d) => d.name + " v" + d.version);
      }
      const db = await new Promise((res, rej) => {
        const r = indexedDB.open('bateo');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
        r.onblocked = () => rej(new Error('blocked'));
      });
      out.version = db.version;
      out.stores = Array.from(db.objectStoreNames).sort();
      const count = (s) => new Promise((res) => {
        try {
          const t = db.transaction([s], 'readonly');
          const r = t.objectStore(s).count();
          r.onsuccess = () => res(r.result);
          r.onerror = () => res('err');
        } catch (e) { res('err'); }
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
    return out;
  })()`);

  console.log("LOCAL_DIAG " + JSON.stringify(diag));
  const ok = diag.errors.length === 0 && diag.missing.length === 0 && diag.appErrors.length === 0 && diag.appRendered;
  app.exit(ok ? 0 : 1);
});
