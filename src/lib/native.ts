import { Capacitor } from "@capacitor/core";

/**
 * Native (Android/iOS) özel başlangıç ayarları.
 * Eklentiler tembel yüklenir → web/masaüstünde ana paket küçük kalır.
 */

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function initNative(): Promise<void> {
  if (!isNative()) return;

  // Durum çubuğu
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#0d0f16" });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch {
    /* yoksay */
  }

  // Açılış ekranını gizle
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    /* yoksay */
  }

  // Android geri tuşu: geçmiş varsa geri, yoksa uygulamadan çık
  try {
    const { App: CapApp } = await import("@capacitor/app");
    await CapApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else void CapApp.exitApp();
    });
  } catch {
    /* yoksay */
  }
}

/** Tema değişince durum çubuğunu güncelle */
export async function syncStatusBar(theme: "dark" | "light"): Promise<void> {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    const style = theme === "dark" ? Style.Dark : Style.Light;
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: theme === "dark" ? "#0d0f16" : "#f4f6fc" });
      await StatusBar.setStyle({ style });
    } else {
      await StatusBar.setStyle({ style });
    }
  } catch {
    /* yoksay */
  }
}
