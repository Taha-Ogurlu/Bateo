// "Tüm verileri sil" testi: kitap + deste + kart + not ekler, butona basar ve hepsinin silindiğini doğrular.
const { app, BrowserWindow } = require("electron");
const { registerPrivileged, registerHandler, APP_URL } = require("../electron/app-protocol.cjs");
const { openAppAsUser } = require("./lib/session.cjs");

app.disableHardwareAcceleration();
registerPrivileged();

app.whenReady().then(async () => {
  registerHandler();
  const win = new BrowserWindow({
    show: false,
    width: 1000,
    height: 900,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  await openAppAsUser(win, APP_URL, { hash: "#/ayarlar", onboarded: true });

  // Örnek veriler
  await win.webContents.executeJavaScript(`(async () => {
    const open = () => new Promise((res, rej) => { const r = indexedDB.open('bateo'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const db = await open();
    const put = (s, o) => new Promise((res) => { const t = db.transaction([s], 'readwrite'); t.objectStore(s).put(o); t.oncomplete = () => res(); });
    const now = Date.now();
    await put('notes', { id: 'w_note', title: 'Test notu', content: '<p>selam</p>', tags: [], pinned: false, favorite: false, archived: false, createdAt: now, updatedAt: now });
    await put('decks', { id: 'w_deck', name: 'Test deste', color: '#8ea0ff', createdAt: now, updatedAt: now });
    await put('flashcards', { id: 'w_card', deckId: 'w_deck', front: 's', back: 'c', ease: 2.5, interval: 0, repetitions: 0, due: now, lapses: 0, reviews: 0, createdAt: now, updatedAt: now });
    await put('books', { id: 'w_book', title: 'Test kitap', status: 'reading', rating: 4, createdAt: now, updatedAt: now, summary: '' });
    await put('bookQuotes', { id: 'w_quote', bookId: 'w_book', text: 'söz', createdAt: now, updatedAt: now });
    db.close();
    return true;
  })()`);

  win.webContents.reload();
  await new Promise((r) => setTimeout(r, 2600));

  const clicked = await win.webContents.executeJavaScript(`(() => {
    window.confirm = () => true;
    const btn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Tüm verileri sil'));
    if (!btn) return false;
    btn.click();
    return true;
  })()`);

  await new Promise((r) => setTimeout(r, 2500));

  const counts = await win.webContents.executeJavaScript(`(async () => {
    const open = () => new Promise((res, rej) => { const r = indexedDB.open('bateo'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const db = await open();
    const count = (s) => new Promise((res) => { const t = db.transaction([s], 'readonly'); const r = t.objectStore(s).count(); r.onsuccess = () => res(r.result); r.onerror = () => res(-1); });
    const out = { notes: await count('notes'), decks: await count('decks'), flashcards: await count('flashcards'), books: await count('books'), bookQuotes: await count('bookQuotes'), outbox: await count('outbox') };
    db.close();
    return out;
  })()`);

  const allZero = Object.values(counts).every((v) => v === 0);
  console.log("WIPE_RESULT " + JSON.stringify({ clicked, counts, ok: allZero }));
  app.exit(allZero ? 0 : 1);
});
