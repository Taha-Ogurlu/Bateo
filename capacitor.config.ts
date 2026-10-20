import type { CapacitorConfig } from "@capacitor/cli";

/**
 * BATEO — Capacitor yapılandırması (v2.0-c)
 * Web derlemesi (dist/) Android WebView içinde çalışır; aynı kod, aynı senkron.
 *
 * Cihazda canlı geliştirme (hot reload) için `server.url` bloğunu aç ve
 * PC'nin yerel IP adresini yaz, sonra: npm run cap:run:android
 */

const config: CapacitorConfig = {
  appId: "com.bateo.app",
  appName: "BATEO",
  webDir: "dist",
  backgroundColor: "#0d0f16",
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  // server: {
  //   url: "http://192.168.1.100:5173",
  //   cleartext: true,
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      launchAutoHide: true,
      backgroundColor: "#0d0f16",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0d0f16",
      overlaysWebView: false,
    },
  },
};

export default config;
