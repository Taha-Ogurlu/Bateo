// Kapı testi: oturum yokken tanıtım + hesap ekranı görünüyor mu?
const { app, BrowserWindow } = require("electron");
const { registerPrivileged, registerHandler, APP_URL } = require("../electron/app-protocol.cjs");

app.disableHardwareAcceleration();
registerPrivileged();

app.whenReady().then(async () => {
  registerHandler();
  const win = new BrowserWindow({
    show: false,
    width: 1100,
    height: 900,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  // Oturumu temizle → kapı görünmeli
  await win.loadURL(APP_URL);
  await win.webContents.executeJavaScript("localStorage.clear(); true;");
  win.webContents.reload();
  await new Promise((r) => setTimeout(r, 2600));

  const intro = await win.webContents.executeJavaScript(`(() => {
    const txt = document.body.innerText || '';
    return {
      hasIntro: txt.includes('Her şey tek yerde') || txt.includes('Odaklan ve ilerlemeni gör'),
      hasSkip: [...document.querySelectorAll('button')].some((b) => (b.textContent || '').trim() === 'Atla'),
      hasLogo: !!document.querySelector('svg[aria-label="BATEO"]'),
      gateVisible: !txt.includes('Ana Sayfa Notlar Görevler'),
    };
  })()`);

  // "Atla" → hesap formu
  const skipRes = await win.webContents.executeJavaScript(`(() => {
    const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Atla');
    if (b) b.click();
    return { found: !!b, labels: [...document.querySelectorAll('button')].map((x) => (x.textContent || '').trim()).slice(0, 12) };
  })()`);
  await new Promise((r) => setTimeout(r, 1800));

  const auth = await win.webContents.executeJavaScript(`(() => {
    const txt = document.body.innerText || '';
    return {
      hasAuthTitle: txt.includes('Hesap oluştur'),
      hasEmail: !!document.querySelector('input[type="email"]'),
      hasPassword: !!document.querySelector('input[type="password"]'),
      hasEyeButton: !!document.querySelector('button[aria-label="Şifreyi göster"]'),
      hasForgot: txt.includes('Şifremi unuttum'),
      hasPrivacyNote: txt.includes('yalnızca sana görünür'),
      snippet: txt.replace(/\\s+/g, ' ').slice(0, 160),
    };
  })()`);

  console.log("GATE_SKIP " + JSON.stringify(skipRes));
  console.log("GATE_RESULT " + JSON.stringify({ ...intro, ...auth }));
  const ok =
    intro.hasIntro &&
    intro.hasSkip &&
    intro.gateVisible &&
    auth.hasAuthTitle &&
    auth.hasEmail &&
    auth.hasPassword &&
    auth.hasEyeButton &&
    auth.hasForgot;
  app.exit(ok ? 0 : 1);
});
