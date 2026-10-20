// Senkron altyapısı testi: yerel bir yazma yapıp outbox'a düştüğünü doğrular.
const { app, BrowserWindow } = require("electron");
const { registerPrivileged, registerHandler, APP_URL } = require("../electron/app-protocol.cjs");
const { openAppAsUser } = require("./lib/session.cjs");

app.disableHardwareAcceleration();
registerPrivileged();

app.whenReady().then(async () => {
  registerHandler();

  const win = new BrowserWindow({
    show: false,
    width: 1100,
    height: 800,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  // ?new=1 → yerel yazma tetikler (outbox dolsun)
  await openAppAsUser(win, APP_URL, { hash: "#/notlar?new=1", onboarded: true });
  await new Promise((r) => setTimeout(r, 1500));

  const res = await win.webContents.executeJavaScript(`(async () => {
    const open = () => new Promise((resolve, reject) => {
      const req = indexedDB.open('bateo');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const db = await open();
    const count = (store) => new Promise((resolve) => {
      if (!db.objectStoreNames.contains(store)) return resolve(-1);
      const tx = db.transaction(store, 'readonly');
      const r = tx.objectStore(store).count();
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => resolve(-1);
    });
    const result = { outbox: await count('outbox'), meta: await count('meta'), notes: await count('notes') };
    db.close();
    return result;
  })()`);

  console.log("SYNC_RESULT " + JSON.stringify(res));
  app.exit(res.outbox > 0 ? 0 : 1);
});
