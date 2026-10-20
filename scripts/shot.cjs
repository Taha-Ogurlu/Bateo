// Görsel doğrulama: kitap ekler (4 yıldız) ve Kitaplar sayfasının ekran görüntüsünü alır.
const { app, BrowserWindow } = require("electron");
const { registerPrivileged, registerHandler, APP_URL } = require("../electron/app-protocol.cjs");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const OUT = path.join(os.tmpdir(), "bateo-shot.png");
app.disableHardwareAcceleration();
registerPrivileged();

app.whenReady().then(async () => {
  registerHandler();
  const win = new BrowserWindow({
    show: false,
    width: 1240,
    height: 860,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  await win.loadURL(APP_URL);
  await new Promise((r) => setTimeout(r, 2200));

  // Hazırlık: onboarding'i kapat + 4 yıldızlı kitap ekle
  await win.webContents.executeJavaScript(`(async () => {
    const open = () => new Promise((res, rej) => { const r = indexedDB.open('bateo'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const db = await open();
    const put = (s, o) => new Promise((res) => { const t = db.transaction([s], 'readwrite'); t.objectStore(s).put(o); t.oncomplete = () => res(); });
    const now = Date.now();
    await put('settings', { id: 'app', theme: 'dark', accent: '#8ea0ff', weekStartsMonday: true, pomodoroWork: 25, pomodoroShortBreak: 5, pomodoroLongBreak: 15, pomodoroRounds: 4, dailyGoalMinutes: 120, weeklyGoalMinutes: 600, userName: '', onboarded: true, notifyTasks: true, notifyExams: true, notifyPomodoro: true, reminderHour: 9 });
    await put('books', { id: 'shotbook', title: 'İnsanın Anlam Arayışı', author: 'Viktor E. Frankl', status: 'reading', rating: 4, createdAt: now, updatedAt: now, summary: '' });
    db.close();
    return true;
  })()`);

  await win.webContents.executeJavaScript(`location.hash = "#/kitaplar"; true;`);
  win.webContents.reload();
  await new Promise((r) => setTimeout(r, 3000));

  const img = await win.webContents.capturePage();
  fs.writeFileSync(OUT, img.toPNG());
  console.log("SHOT_OK " + OUT);
  app.exit(0);
});
