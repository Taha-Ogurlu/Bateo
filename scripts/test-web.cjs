// Web (PWA) testi: http://localhost:4173 üzerinden uygulama açılıyor mu,
// service worker kaydoluyor mu, manifest bağlı mı?
const { app, BrowserWindow } = require("electron");

const URL_ = process.env.WEB_URL || "http://localhost:4173/";

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 1100,
    height: 820,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  const logs = [];
  try {
    win.webContents.on("console-message", (...args) => {
      const a1 = args[1];
      if (typeof a1 === "object" && a1 && a1.level === "error") logs.push(a1.message);
    });
  } catch {
    /* yoksay */
  }

  let res = {};
  try {
    await win.loadURL(URL_);
    await new Promise((r) => setTimeout(r, 3500));
    res = await win.webContents.executeJavaScript(`(async () => {
      const regs = ('serviceWorker' in navigator) ? await navigator.serviceWorker.getRegistrations() : [];
      const txt = document.body.innerText || '';
      const manifest = document.querySelector('link[rel="manifest"]');
      return {
        rootChildren: (document.getElementById('root') || { children: [] }).children.length,
        gateVisible: txt.includes('Hesap oluştur') || txt.includes('Her şey tek yerde'),
        swRegistrations: regs.length,
        swScope: regs[0] ? regs[0].scope : null,
        manifestHref: manifest ? manifest.getAttribute('href') : null,
        title: document.title,
      };
    })()`);
  } catch (e) {
    res = { error: String(e && e.message) };
  }

  console.log("WEB_RESULT " + JSON.stringify({ ...res, errors: logs.slice(0, 4) }));
  const ok = res.rootChildren > 0 && res.swRegistrations > 0 && !!res.manifestHref;
  app.exit(ok ? 0 : 1);
});
