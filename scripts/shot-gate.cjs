// Kapı ekranının görsel doğrulaması: localStorage temizlenir, tanıtım ekranı görüntülenir.
const { app, BrowserWindow } = require("electron");
const { registerPrivileged, registerHandler, APP_URL } = require("../electron/app-protocol.cjs");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const OUT = path.join(os.tmpdir(), "bateo-gate.png");
app.disableHardwareAcceleration();
registerPrivileged();

app.whenReady().then(async () => {
  registerHandler();
  const win = new BrowserWindow({
    show: false,
    width: 1100,
    height: 820,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  await win.loadURL(APP_URL);
  await win.webContents.executeJavaScript("localStorage.clear(); true;");
  win.webContents.reload();
  await new Promise((r) => setTimeout(r, 3000));

  const img = await win.webContents.capturePage();
  fs.writeFileSync(OUT, img.toPNG());
  console.log("GATE_SHOT " + OUT);
  app.exit(0);
});
