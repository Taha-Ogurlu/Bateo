// Bir videodan kare (frame) çıkarır: electron scripts/extract-frames.cjs "<video yolu>"
// Çıktı: %TEMP%/bateo-frames/frame-*.png
const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { pathToFileURL } = require("node:url");

const VIDEO = process.argv[2];
const OUT = path.join(os.tmpdir(), "bateo-frames");

app.on("window-all-closed", () => {});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function js(win, code, timeoutMs = 4000) {
  return Promise.race([
    win.webContents.executeJavaScript(code),
    wait(timeoutMs).then(() => "__TIMEOUT__"),
  ]);
}

app.whenReady().then(async () => {
  if (!VIDEO || !fs.existsSync(VIDEO)) {
    console.log("FRAMES_RESULT " + JSON.stringify({ ok: false, error: "video bulunamadı" }));
    return app.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) fs.unlinkSync(path.join(OUT, f));

  // HTML dosyasını diske yaz → video ile aynı köken (file://)
  const htmlFile = path.join(OUT, "player.html");
  fs.writeFileSync(
    htmlFile,
    `<!doctype html><html><body style="margin:0;background:#000">
     <video id="v" src="${pathToFileURL(VIDEO).href}" muted preload="auto" style="width:100%;display:block"></video>
     </body></html>`,
    "utf8",
  );

  const win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 780,
    backgroundColor: "#000000",
    webPreferences: { paintWhenInitiallyHidden: true },
  });
  await win.loadURL(pathToFileURL(htmlFile).href);

  const err = await js(
    win,
    `new Promise((res) => { const v=document.getElementById('v');
       if (v.readyState>=1) return res(null);
       v.onloadedmetadata=()=>res(null);
       v.onerror=()=>res('video yüklenemedi: ' + (v.error && v.error.code));
       setTimeout(()=>res('metadata zaman aşımı'), 15000); })`,
    20000,
  );
  if (err) {
    console.log("FRAMES_RESULT " + JSON.stringify({ ok: false, error: err }));
    return app.exit(1);
  }

  const meta = await js(win, `(() => { const v=document.getElementById('v'); return { duration: v.duration, w: v.videoWidth, h: v.videoHeight }; })()`);

  const times = [];
  for (let t = 0.3; t < Math.min(meta.duration || 10, 12); t += 0.6) times.push(Number(t.toFixed(2)));

  const saved = [];
  for (const t of times) {
    await js(win, `new Promise((res) => { const v=document.getElementById('v'); v.onseeked=()=>res(true); v.currentTime=${t}; setTimeout(()=>res(true), 1500); })`, 3000);
    await wait(250);
    const img = await win.webContents.capturePage();
    const file = path.join(OUT, `frame-${String(t).replace(".", "_")}.png`);
    fs.writeFileSync(file, img.toPNG());
    saved.push(path.basename(file));
  }

  console.log("FRAMES_RESULT " + JSON.stringify({ ok: true, meta, count: saved.length, dir: OUT, files: saved }));
  app.exit(0);
});
