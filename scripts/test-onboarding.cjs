// Profil kurulum modalı testi:
// - onboarded=true iken HİÇ görünmemeli (açılış flash'ı yok)
// - onboarded=false iken görünmeli ve "Şimdi değil" ile kapatılabilmeli
const { app, BrowserWindow } = require("electron");
const { registerPrivileged, registerHandler, APP_URL } = require("../electron/app-protocol.cjs");
const { openAppAsUser, wait } = require("./lib/session.cjs");

app.disableHardwareAcceleration();
registerPrivileged();

const MODAL_TEXT = "Sana nasıl hitap edelim";

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

  // 1) onboarded = true → modal görünmemeli
  await openAppAsUser(win, APP_URL, { hash: "#/", onboarded: true });
  const withOnboarded = await win.webContents.executeJavaScript(
    `(document.body.innerText || '').includes(${JSON.stringify(MODAL_TEXT)})`,
  );

  // 2) onboarded = false → modal görünmeli
  await win.webContents.executeJavaScript(`(async () => {
    const open = () => new Promise((res, rej) => { const r = indexedDB.open('bateo'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const db = await open();
    const get = () => new Promise((res) => { const t = db.transaction(['settings'], 'readonly'); const r = t.objectStore('settings').get('app'); r.onsuccess = () => res(r.result); });
    const s = await get();
    s.onboarded = false;
    await new Promise((res) => { const t = db.transaction(['settings'], 'readwrite'); t.objectStore('settings').put(s); t.oncomplete = () => res(); });
    db.close();
    return true;
  })()`);
  win.webContents.reload();
  await wait(2600);
  const withNotOnboarded = await win.webContents.executeJavaScript(
    `(document.body.innerText || '').includes(${JSON.stringify(MODAL_TEXT)})`,
  );

  // 3) "Şimdi değil" ile kapat → kaybolmalı
  const skipped = await win.webContents.executeJavaScript(`(() => {
    const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Şimdi değil');
    if (b) b.click();
    return !!b;
  })()`);
  await wait(1500);
  const afterSkip = await win.webContents.executeJavaScript(
    `(document.body.innerText || '').includes(${JSON.stringify(MODAL_TEXT)})`,
  );

  const res = {
    hiddenWhenOnboarded: withOnboarded === false,
    visibleWhenNotOnboarded: withNotOnboarded === true,
    skipButtonFound: skipped,
    hiddenAfterSkip: afterSkip === false,
  };
  console.log("ONBOARDING_RESULT " + JSON.stringify(res));
  const ok = Object.values(res).every(Boolean);
  app.exit(ok ? 0 : 1);
});
