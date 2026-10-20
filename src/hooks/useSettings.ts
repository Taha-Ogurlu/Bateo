import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { DEFAULT_SETTINGS, getSettings, updateSettings } from "../db/db";
import { cacheTheme, getTheme, themeCssVars, themeIsDark } from "../lib/themes";
import { syncStatusBar } from "../lib/native";

/**
 * Ayarları canlı izler. Tema uygulama işi useThemeSync tarafından tek bir kez,
 * uygulama kökünde yapılır; ekranlar bu hook'u çağırınca tema tekrar uygulanmaz.
 */
export function useSettings() {
  const settings = useLiveQuery(() => getSettings(), [], DEFAULT_SETTINGS);

  return settings ?? DEFAULT_SETTINGS;
}

/**
 * Temayı uygulama kökünden uygular. useSettings ekran bileşenlerinde de
 * kullanıldığı için yan etkileri orada çalıştırmak, her sayfa açılışında
 * yükleme varsayılanının (Gece) seçili temayı kısa süreli ezmesine yol açardı.
 */
export function useThemeSync(): void {
  // Varsayılan değer verme: IndexedDB'den gerçek ayar gelene kadar önbellekteki
  // tema görünür kalmalı; geçici varsayılanı DOM'a uygulamamalıyız.
  const settings = useLiveQuery(() => getSettings(), []);

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    const theme = getTheme(settings.themeId);

    // --- Temaya göre koyu/açık OTOMATİK ---
    const shouldBeDark = themeIsDark(theme);
    if ((settings.theme === "dark") !== shouldBeDark) {
      void updateSettings({ theme: shouldBeDark ? "dark" : "light" });
    }
    root.classList.toggle("dark", shouldBeDark);

    // --- Tüm değişkenler (tek kaynaktan) ---
    for (const [k, v] of Object.entries(themeCssVars(theme))) {
      root.style.setProperty(k, v);
    }
    root.dataset.theme = theme.id;

    // --- Önbelleğe yaz (sonraki açılışta flash olmaması için) ---
    cacheTheme(theme);

    const solid = themeCssVars(theme)["--bg-solid"];
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", solid);

    void syncStatusBar(shouldBeDark ? "dark" : "light");
  }, [settings]);
}
