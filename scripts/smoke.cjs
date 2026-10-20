// Duman testi: uygulamayı (oturum açılmış olarak) açar, arayüzün render olduğunu ve
// konsol hatası olmadığını doğrular.
// Kullanım: SMOKE_URL="app://bateo/index.html#/odak" (veya SMOKE_HASH="#/odak")
const { app, BrowserWindow } = require("electron");
const { registerPrivileged, registerHandler, APP_URL } = require("../electron/app-protocol.cjs");
const { openAppAsUser } = require("./lib/session.cjs");

const raw = process.env.SMOKE_URL || "";
const hash = process.env.SMOKE_HASH || (raw.includes("#") ? raw.slice(raw.indexOf("#")) : "#/");

app.disableHardwareAcceleration();
registerPrivileged();

app.whenReady().then(async () => {
  registerHandler();

  const win = new BrowserWindow({
    show: false,
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      preload: require("node:path").join(__dirname, "smoke-preload.cjs"),
    },
  });

  const logs = [];
  try {
    win.webContents.on("console-message", (...args) => {
      const a1 = args[1];
      if (typeof a1 === "object" && a1 && a1.level) {
        if (a1.level === "error") logs.push(a1.message);
      }
    });
  } catch {
    /* yoksay */
  }

  await openAppAsUser(win, APP_URL, { hash, onboarded: true });

  let res = {};
  try {
    res = await win.webContents.executeJavaScript(`(() => {
      const root = document.getElementById('root');
      const txt = document.body.innerText || '';
      return {
        url: location.href,
        rootChildren: root ? root.children.length : -1,
        bodyLength: document.body.innerHTML.length,
        brandLogos: document.querySelectorAll('svg[aria-label="BATEO"]').length,
        gateVisible: txt.includes('Hesap oluştur') && !!document.querySelector('input[type="email"]'),
        preview: txt.replace(/\\s+/g,' ').slice(0, 200)
      };
    })()`);
  } catch (e) {
    res = { error: String(e && e.message) };
  }

  let captured = [];
  try {
    captured = await win.webContents.executeJavaScript("window.__BATEO_ERRORS || []");
  } catch {
    /* yoksay */
  }

  console.log("SMOKE_RESULT " + JSON.stringify(res));
  console.log("LOGS " + JSON.stringify(logs.slice(0, 6)));
  console.log("CAPTURED " + JSON.stringify(captured.slice(0, 6)));

  const ok = res.rootChildren > 0 && !res.gateVisible;
  app.exit(ok ? 0 : 1);
});
