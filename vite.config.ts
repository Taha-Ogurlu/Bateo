import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// PWA yalnızca web hedefinde eklenir (Electron derlemesini etkilemez)
const isWeb = process.env.BATEO_TARGET === "web";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    ...(isWeb
      ? [
          VitePWA({
            registerType: "autoUpdate",
            injectRegister: "auto",
            includeAssets: ["favicon.svg"],
            manifest: {
              name: "BATEO — Öğrenci Merkezi",
              short_name: "BATEO",
              description: "Ders çalışma, not alma ve planlama merkezin.",
              lang: "tr",
              theme_color: "#0d0f16",
              background_color: "#0d0f16",
              display: "standalone",
              orientation: "any",
              start_url: "./",
              scope: "./",
              icons: [
                { src: "./pwa-192.png", sizes: "192x192", type: "image/png" },
                { src: "./pwa-512.png", sizes: "512x512", type: "image/png" },
                { src: "./maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
              ],
            },
            workbox: {
              // Theme wallpapers are public JPG files; include them in the PWA
              // precache so installed/offline web apps do not lose backgrounds.
              globPatterns: ["**/*.{js,css,html,svg,png,jpg,webmanifest,woff2}"],
              navigateFallback: "index.html",
              maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
              cleanupOutdatedCaches: true,
              skipWaiting: true,
              clientsClaim: true,
            },
            devOptions: { enabled: false },
          }),
        ]
      : []),
  ],
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // Gradle/OneDrive yazımları sayfayı sürekli yenilemesin
      ignored: ["**/android/**", "**/dist/**", "**/release/**", "**/.git/**"],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
