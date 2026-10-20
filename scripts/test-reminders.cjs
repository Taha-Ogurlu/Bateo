// Hatırlatıcı testi: bugüne bir görev ekler, hatırlatma saatini 00:00 yapar,
// uygulamayı yükler ve `meta.reminderLog`'a günlük özet kaydının yazıldığını doğrular.
const { app, BrowserWindow } = require("electron");
const { registerPrivileged, registerHandler, APP_URL } = require("../electron/app-protocol.cjs");
const { openAppAsUser } = require("./lib/session.cjs");

app.disableHardwareAcceleration();
registerPrivileged();

const TASK_ID = "test_reminder_task";

app.whenReady().then(async () => {
  registerHandler();
  const win = new BrowserWindow({
    show: false,
    width: 1000,
    height: 800,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  await openAppAsUser(win, APP_URL, { hash: "#/", onboarded: true });

  // Hazırlık: görev ekle, saat 00:00, log temizle
  await win.webContents.executeJavaScript(`(async () => {
    const open = () => new Promise((res, rej) => { const r = indexedDB.open('bateo'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const db = await open();
    const put = (store, obj) => new Promise((res) => { const t = db.transaction([store], 'readwrite'); t.objectStore(store).put(obj); t.oncomplete = () => res(); });
    const del = (store, key) => new Promise((res) => { const t = db.transaction([store], 'readwrite'); t.objectStore(store).delete(key); t.oncomplete = () => res(); });
    const get = (store, key) => new Promise((res) => { const t = db.transaction([store], 'readonly'); const r = t.objectStore(store).get(key); r.onsuccess = () => res(r.result); });

    const settings = (await get('settings', 'app')) || { id: 'app' };
    settings.reminderHour = 0;
    settings.notifyTasks = true;
    await put('settings', settings);

    const now = Date.now();
    await put('tasks', {
      id: ${JSON.stringify(TASK_ID)}, title: 'Test görevi', status: 'todo', priority: 'normal',
      dueDate: now - 3600000, courseId: null, tags: [], subtasks: [], createdAt: now, updatedAt: now,
    });
    await del('meta', 'reminderLog');
    db.close();
    return true;
  })()`);

  win.webContents.reload();
  await new Promise((r) => setTimeout(r, 5000));

  const check = await win.webContents.executeJavaScript(`(async () => {
    const open = () => new Promise((res, rej) => { const r = indexedDB.open('bateo'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const db = await open();
    const get = (store, key) => new Promise((res) => { const t = db.transaction([store], 'readonly'); const r = t.objectStore(store).get(key); r.onsuccess = () => res(r.result); });
    const del = (store, key) => new Promise((res) => { const t = db.transaction([store], 'readwrite'); t.objectStore(store).delete(key); t.oncomplete = () => res(); });
    const log = await get('meta', 'reminderLog');
    const keys = log && log.value ? Object.keys(log.value) : [];
    const settings = (await get('settings', 'app')) || {};
    settings.reminderHour = 9;
    await new Promise((res) => { const t = db.transaction(['settings'], 'readwrite'); t.objectStore('settings').put(settings); t.oncomplete = () => res(); });
    await del('tasks', ${JSON.stringify(TASK_ID)});
    db.close();
    return { logKeys: keys, fired: keys.some((k) => k.startsWith('digest:')) };
  })()`);

  console.log("REMINDER_RESULT " + JSON.stringify(check));
  app.exit(check.fired ? 0 : 1);
});
