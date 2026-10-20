// Editör testi: yeni not açar ve zengin (TipTap) editörün yüklendiğini doğrular.
const { app, BrowserWindow } = require("electron");
const { registerPrivileged, registerHandler, APP_URL } = require("../electron/app-protocol.cjs");
const { openAppAsUser } = require("./lib/session.cjs");

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

  const errors = [];
  try {
    win.webContents.on("console-message", (...args) => {
      const a1 = args[1];
      if (typeof a1 === "object" && a1 && a1.level === "error") errors.push(a1.message);
    });
  } catch {
    /* yoksay */
  }

  await openAppAsUser(win, APP_URL, { hash: "#/notlar?new=1", onboarded: true });
  await new Promise((r) => setTimeout(r, 1500));

  const res = await win.webContents.executeJavaScript(`(() => {
    const pm = document.querySelector('.ProseMirror');
    const toolbar = document.querySelectorAll('button[title]');
    return {
      hasEditor: !!pm,
      hasToolbarButtons: toolbar.length > 5,
      titleInput: !!document.querySelector('input[placeholder="Başlıksız not"]'),
      errors: (window.__BATEO_ERRORS || []).slice(0, 3),
    };
  })()`);

  console.log("EDITOR_RESULT " + JSON.stringify({ ...res, consoleErrors: errors.slice(0, 3) }));
  const ok = res.hasEditor && res.hasToolbarButtons && res.titleInput;
  app.exit(ok ? 0 : 1);
});
