// Tema + içerik kontrastı teşhisi
// electron scripts/probe-theme.cjs <temaId> <hash>
const { app, BrowserWindow } = require("electron");
const { registerPrivileged, registerHandler, APP_URL } = require("../electron/app-protocol.cjs");
const { openAppAsUser, wait } = require("./lib/session.cjs");

const arg = (i, def) => {
  const v = process.argv[i];
  return !v || v === "none" ? def : v;
};
const themeId = arg(2, "kum");
const hash = arg(3, "#/notlar");

app.disableHardwareAcceleration();
registerPrivileged();

app.whenReady().then(async () => {
  registerHandler();
  const win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 900,
    webPreferences: { contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
  });
  await openAppAsUser(win, APP_URL, { hash, onboarded: true });

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
  await wait(3200);

  const res = await win.webContents.executeJavaScript(`(() => {
    const root = getComputedStyle(document.documentElement);
    const g = (n) => root.getPropertyValue(n).trim();
    const center = document.elementFromPoint(Math.round(window.innerWidth * 0.6), Math.round(window.innerHeight * 0.5));
    const chain = [];
    let el = center;
    for (let i = 0; i < 6 && el; i++) {
      const cs = getComputedStyle(el);
      chain.push({
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || '').slice(0, 60),
        color: cs.color,
        bg: cs.backgroundColor,
        opacity: cs.opacity,
        z: cs.zIndex,
      });
      el = el.parentElement;
    }
    const overlays = [...document.querySelectorAll('[data-radix-portal], [data-state="open"], .fixed.inset-0')]
      .map((e) => ({ cls: String(e.className || '').slice(0, 70), bg: getComputedStyle(e).backgroundColor, z: getComputedStyle(e).zIndex }))
      .slice(0, 6);
    return {
      theme: document.documentElement.dataset.theme,
      dark: document.documentElement.classList.contains('dark'),
      vars: { content: g('--content'), surface: g('--surface'), bg: g('--bg'), line: g('--line'), wp: g('--wallpaper-opacity') },
      bodyColor: getComputedStyle(document.body).color,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      chain,
      overlays,
    };
  })()`);

  console.log("PROBE " + JSON.stringify(res));
  app.exit(0);
});
