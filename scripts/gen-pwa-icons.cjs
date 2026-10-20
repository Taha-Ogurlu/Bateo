// PWA ikonlarını üretir: public/pwa-192.png, public/pwa-512.png, public/maskable-512.png
// Çalıştırma: npm run pwa:icons
const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public");
const ICON_SRC = path.join(ROOT, "assets", "bateo-icon.svg");

app.on("window-all-closed", () => {});
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function cleanSvg(svg) {
  return svg
    .replace(/<metadata>[\s\S]*?<\/metadata>/g, "")
    .replace(/<svg([^>]*?)\swidth="[^"]*"/, "<svg$1")
    .replace(/<svg([^>]*?)\sheight="[^"]*"/, "<svg$1");
}

/** İkonun iç elemanları (arka plan rect'i hariç) — maskable için yeniden kullanılır */
function innerElements() {
  return `
    <rect x="116" y="120" width="280" height="300" rx="44" fill="#ffffff"/>
    <path d="M140 176h232" stroke="#e3e6f6" stroke-width="6" stroke-linecap="round"/>
    <rect x="186" y="88" width="28" height="66" rx="14" fill="#ffffff" stroke="#6a63f0" stroke-width="8"/>
    <rect x="298" y="88" width="28" height="66" rx="14" fill="#ffffff" stroke="#6a63f0" stroke-width="8"/>
    <path d="M198 200V380M198 200H260a42 42 0 0 1 0 84H198M198 284H270a48 48 0 0 1 0 96H198"
          fill="none" stroke="url(#g)" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="372" cy="396" r="44" fill="#22c58b" stroke="#6f62f0" stroke-width="10"/>
    <path d="M352 396l14 14 28-30" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function maskableSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4f6bed"/><stop offset="1" stop-color="#8b5cf6"/>
    </linearGradient></defs>
    <rect width="512" height="512" fill="url(#g)"/>
    <g transform="translate(256 262) scale(0.70) translate(-256 -256)">${innerElements()}</g>
  </svg>`;
}

function htmlFor(svg, size, bg) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;width:${size}px;height:${size}px;overflow:hidden;background:${bg}}
    .wrap{width:${size}px;height:${size}px}
    svg{width:100%!important;height:100%!important;display:block}
  </style></head><body><div class="wrap">${svg}</div></body></html>`;
}

async function renderPng(html, size, outFile, transparent) {
  const win = new BrowserWindow({
    show: false,
    width: size,
    height: size,
    transparent,
    backgroundColor: transparent ? "#00000000" : "#4f6bed",
    webPreferences: { paintWhenInitiallyHidden: true },
  });
  await win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
  await wait(800);
  const img = await win.webContents.capturePage();
  fs.writeFileSync(outFile, img.toPNG());
  win.destroy();
  return outFile;
}

app.whenReady().then(async () => {
  try {
    const svg = cleanSvg(fs.readFileSync(ICON_SRC, "utf8"));
    const files = [];
    files.push(await renderPng(htmlFor(svg, 192, "transparent"), 192, path.join(OUT, "pwa-192.png"), true));
    files.push(await renderPng(htmlFor(svg, 512, "transparent"), 512, path.join(OUT, "pwa-512.png"), true));
    files.push(await renderPng(htmlFor(maskableSvg(), 512, "#4f6bed"), 512, path.join(OUT, "maskable-512.png"), false));
    console.log("PWA_ICONS " + JSON.stringify({ ok: true, files: files.map((f) => `${path.basename(f)}=${fs.statSync(f).size}b`) }));
    app.exit(0);
  } catch (e) {
    console.log("PWA_ICONS " + JSON.stringify({ ok: false, error: String(e && e.message) }));
    app.exit(1);
  }
});
