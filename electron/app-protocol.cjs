const { protocol } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

const ROOT = path.join(__dirname, "..", "dist");
const SCHEME = "app";
const HOST = "bateo";

// Paketlenmiş uygulama için içerik güvenliği politikası
const CSP =
  "default-src 'self'; " +
  "script-src 'self'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; " +
  "font-src 'self' data:; " +
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co; " +
  "media-src 'self' blob:; " +
  "base-uri 'self'; " +
  "form-action 'self'";

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

/** app.whenReady() ÖNCESİ çağrılmalı */
function registerPrivileged() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true },
    },
  ]);
}

/** app.whenReady() SONRASI çağrılmalı — dist/ klasörünü app:// üzerinden sunar */
function registerHandler() {
  protocol.handle(SCHEME, async (request) => {
    const { pathname } = new URL(request.url);
    let rel = decodeURIComponent(pathname);
    if (rel === "/" || rel === "") rel = "/index.html";
    const filePath = path.normalize(path.join(ROOT, rel));

    // Güvenlik: dist/ dışına çıkışı engelle
    if (!filePath.startsWith(ROOT)) {
      return new Response("Forbidden", { status: 403 });
    }
    try {
      const data = await fs.promises.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const headers = { "content-type": MIME[ext] || "application/octet-stream" };
      if (ext === ".html") headers["content-security-policy"] = CSP;
      return new Response(data, { headers });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });
}

const APP_URL = `${SCHEME}://${HOST}/index.html`;

module.exports = { registerPrivileged, registerHandler, APP_URL };
