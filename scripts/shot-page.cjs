// Sayfa ekran görüntüsü (opsiyonel tema + kaydırma)
// electron scripts/shot-page.cjs "#/ayarlar" [temaId] [kaydirilacakMetin]
const { app, BrowserWindow } = require("electron");
const { registerPrivileged, registerHandler, APP_URL } = require("../electron/app-protocol.cjs");
const { openAppAsUser, wait } = require("./lib/session.cjs");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const hash = process.argv[2] || "#/";
const arg = (i) => {
  const v = process.argv[i];
  return !v || v === "none" ? "" : v;
};
const themeId = arg(3);
const scrollTo = arg(4);
const out = path.join(os.tmpdir(), "bateo-shot-" + (themeId || scrollTo || "default") + ".png");

app.disableHardwareAcceleration();
registerPrivileged();

app.whenReady().then(async () => {
  registerHandler();
  const win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 940,
    webPreferences: { contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
  });

  await openAppAsUser(win, APP_URL, { hash, onboarded: true });

  if (themeId) {
    await win.webContents.executeJavaScript(`(async () => {
      const open = () => new Promise((res, rej) => { const r = indexedDB.open('bateo'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
      const db = await open();
      const get = () => new Promise((res) => { const t = db.transaction(['settings'], 'readonly'); const r = t.objectStore('settings').get('app'); r.onsuccess = () => res(r.result); });
      const s = await get();
      s.themeId = ${JSON.stringify(themeId)};
      s.accent = "";
      await new Promise((res) => { const t = db.transaction(['settings'], 'readwrite'); t.objectStore('settings').put(s); t.oncomplete = () => res(); });
      db.close();
      return true;
    })()`);
    win.webContents.reload();
    await wait(2600);
  }

  if (scrollTo) {
    await win.webContents.executeJavaScript(`(() => {
      const el = [...document.querySelectorAll('h4,h3,p,span')].find((x) => (x.textContent || '').includes(${JSON.stringify(scrollTo)}));
      if (el) el.scrollIntoView({ block: 'center' });
      return !!el;
    })()`);
    await wait(900);
  }

  // Ekran görüntüsünde geçişleri kapat (gizli pencerede takılı kalıyorlar)
  await win.webContents.insertCSS(`*,*::before,*::after{transition:none!important;animation:none!important}`);
  await wait(500);

  const img = await win.webContents.capturePage();
  fs.writeFileSync(out, img.toPNG());
  console.log("SHOT " + out);
  app.exit(0);
});
