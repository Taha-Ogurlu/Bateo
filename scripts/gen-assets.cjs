// Marka SVG'lerinden Android/iOS ikon ve açılış PNG'leri üretir.
// Çalıştırma: npm run assets
const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "assets");
const ICON_SRC = path.join(OUT, "bateo-icon.svg");

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

function cleanSvg(svg) {
  // c2pa metadata bloğunu temizle (boyutu şişiriyor)
  return svg
    .replace(/<metadata>[\s\S]*?<\/metadata>/g, "")
    .replace(/<svg([^>]*?)\swidth="[^"]*"/, "<svg$1")
    .replace(/<svg([^>]*?)\sheight="[^"]*"/, "<svg$1");
}

function htmlFor(svg, size, opts = {}) {
  const { bg = "transparent", iconSize = null } = opts;
  const inner =
    iconSize === null
      ? `<div class="wrap">${svg}</div>`
      : `<div class="wrap" style="width:${iconSize}px;height:${iconSize}px">${svg}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;width:${size}px;height:${size}px;overflow:hidden;background:${bg}}
    body{display:grid;place-items:center}
    .wrap{width:100%;height:100%}
    svg{width:100%!important;height:100%!important;display:block}
  </style></head><body>${inner}</body></html>`;
}

async function renderPng(html, size, outFile, transparent) {
  const win = new BrowserWindow({
    show: false,
    width: size,
    height: size,
    transparent,
    backgroundColor: transparent ? "#00000000" : "#0d0f16",
    webPreferences: { paintWhenInitiallyHidden: true },
  });

  const dataUrl = "data:text/html;charset=utf-8," + encodeURIComponent(html);
  await win.loadURL(dataUrl);
  await new Promise((r) => setTimeout(r, 900));
  const image = await win.webContents.capturePage();
  fs.writeFileSync(outFile, image.toPNG());
  win.destroy();
  return outFile;
}

app.on("window-all-closed", () => {
  // pencere kapatınca uygulamayı kapatma (ardışık render'lar için)
});

app.whenReady().then(async () => {
  try {
    const raw = fs.readFileSync(ICON_SRC, "utf8");
    const svg = cleanSvg(raw);

    const icon = path.join(OUT, "icon.png");
    const splash = path.join(OUT, "splash.png");
    const splashDark = path.join(OUT, "splash-dark.png");

    // 1) Uygulama ikonu (1024, saydam köşeler)
    await renderPng(htmlFor(svg, 1024), 1024, icon, true);
    // 2) Açılış ekranı (1000, koyu zemin, ortada ikon)
    await renderPng(htmlFor(svg, 1000, { bg: "#0d0f16", iconSize: 300 }), 1000, splash, false);
    await renderPng(htmlFor(svg, 1000, { bg: "#0d0f16", iconSize: 300 }), 1000, splashDark, false);

    const sizes = [icon, splash, splashDark].map((f) => `${path.basename(f)}=${fs.statSync(f).size}b`);
    console.log("ASSETS_RESULT " + JSON.stringify({ ok: true, files: sizes }));
    app.exit(0);
  } catch (e) {
    console.log("ASSETS_RESULT " + JSON.stringify({ ok: false, error: String(e && e.message) }));
    app.exit(1);
  }
});
