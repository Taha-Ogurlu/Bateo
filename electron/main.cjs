const { app, BrowserWindow, shell, session } = require("electron");
const path = require("node:path");
const { registerPrivileged, registerHandler, APP_URL } = require("./app-protocol.cjs");

const isDev = !app.isPackaged;
const DEV_URL = "http://localhost:5173";

// Windows bildirimlerinde uygulama adının doğru görünmesi için
app.setName("BATEO");
app.setAppUserModelId("com.bateo.app");

// Şema ayrıcalıkları app.whenReady() öncesinde tanımlanmalı
if (!isDev) registerPrivileged();

/** @type {BrowserWindow | null} */
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 850,
    minWidth: 940,
    minHeight: 620,
    backgroundColor: "#0d0f16",
    title: "BATEO",
    icon: path.join(__dirname, "..", "assets", "bateo-icon.ico"),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: require("node:path").join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow && mainWindow.show());

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadURL(APP_URL);
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  if (!isDev) registerHandler();

  // Bildirim izni: renderer'ın system bildirimi göstermesine izin ver
  try {
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      callback(permission === "notifications");
    });
  } catch {
    /* yoksay */
  }

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
