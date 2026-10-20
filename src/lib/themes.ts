/**
 * BATEO tema sistemi
 * Her tema bir dizi CSS değişkeni + yazı tipi + (isteğe bağlı) arka plan görseli tanımlar.
 *
 * Görsel eklemek için: public/themes/<id>.jpg  (1920×1080, JPG, < 400 KB)
 * Görsel yoksa temanın gradyan yedeği kullanılır — sorunsuz çalışır.
 */

export type FontFamily = "sans" | "serif" | "mono" | "rounded" | "display";
export type ThemeFamily = "renk" | "yazi" | "sinematik";

export interface ThemeVars {
  bg: string;
  bg2: string;
  surface: string;
  elevated: string;
  content: string;
  muted: string;
  line: string;
  accent: string;
  accent2: string;
}

export interface Theme {
  id: string;
  name: string;
  family: ThemeFamily;
  description: string;
  font: FontFamily;
  /** arka plan görseli (varsa) */
  image?: string;
  /** görsel yokken/altında kullanılan gradyan */
  wallpaper?: string;
  /** Çok hafif, dekoratif arka plan hareketi */
  wallpaperMotion?: boolean;
  vars: ThemeVars;
}

export const FONT_STACKS: Record<FontFamily, string> = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'Georgia, "Iowan Old Style", "Times New Roman", Georgia, serif',
  mono: '"Cascadia Code", Consolas, "JetBrains Mono", "Courier New", monospace',
  rounded: '"Arial Rounded MT Bold", "Trebuchet MS", "Segoe UI", sans-serif',
  display: '"Bahnschrift", "Aptos Display", "Segoe UI Variable Display", "Segoe UI", sans-serif',
};

// Resolve public theme images from the document root. Relative CSS URLs were
// being resolved under /assets after Vite emitted index.css, so cinematic
// wallpapers disappeared in web/PWA builds.
const IMG = (id: string) => `url("${new URL(`${import.meta.env.BASE_URL}themes/${id}.jpg`, document.baseURI).href}")`;

export const THEMES: Theme[] = [
  /* ---------------- Sadece renk ---------------- */
  {
    id: "gece",
    name: "Gece",
    family: "renk",
    description: "Koyu, göz yormayan varsayılan",
    font: "sans",
    vars: {
      bg: "#0d0f16", bg2: "#12141c", surface: "#161922", elevated: "#1b1f2b",
      content: "#eceff8", muted: "#9aa1b5", line: "#262b3a", accent: "#8ea0ff", accent2: "#b48cff",
    },
  },
  {
    id: "aydinlik",
    name: "Aydınlık",
    family: "renk",
    description: "Temiz ve ferah gündüz teması",
    font: "sans",
    vars: {
      bg: "#f4f6fc", bg2: "#eaeefb", surface: "#ffffff", elevated: "#ffffff",
      content: "#171a24", muted: "#6b7285", line: "#e3e6f0", accent: "#4f6bed", accent2: "#7c5cf0",
    },
  },
  {
    id: "okyanus",
    name: "Okyanus",
    family: "renk",
    description: "Derin mavi ve turkuaz",
    font: "rounded",
    vars: {
      bg: "#071a24", bg2: "#0a2230", surface: "#0e2a3a", elevated: "#123244",
      content: "#e6f4f8", muted: "#8fb3c2", line: "#1b3d4f", accent: "#35c2d4", accent2: "#4f9dff",
    },
  },
  {
    id: "orman",
    name: "Orman",
    family: "renk",
    description: "Sakin yeşil tonlar",
    font: "rounded",
    vars: {
      bg: "#0a1410", bg2: "#0e1c16", surface: "#12241c", elevated: "#172c23",
      content: "#e8f3ec", muted: "#8fb3a1", line: "#1f3a2e", accent: "#3dd68c", accent2: "#8fe08a",
    },
  },
  {
    id: "gul",
    name: "Gül Kurusu",
    family: "renk",
    description: "Yumuşak pembe-mor",
    font: "rounded",
    vars: {
      bg: "#170f18", bg2: "#1e141f", surface: "#251a27", elevated: "#2d2030",
      content: "#f7ecf5", muted: "#bfa3bd", line: "#3a2a3d", accent: "#ff8fc7", accent2: "#c9a0ff",
    },
  },
  {
    id: "masal",
    name: "Masal Bulutları",
    family: "renk",
    description: "Yumuşak pastel renkler ve usulca süzülen bulutlar",
    font: "rounded",
    wallpaperMotion: true,
    wallpaper:
      "radial-gradient(ellipse 320px 190px at 16% 28%, rgba(255,205,120,0.58), transparent 76%), radial-gradient(ellipse 380px 220px at 78% 26%, rgba(125,205,222,0.48), transparent 76%), radial-gradient(ellipse 280px 170px at 60% 82%, rgba(214,174,226,0.40), transparent 78%), radial-gradient(ellipse 240px 150px at 30% 78%, rgba(255,153,143,0.34), transparent 78%), linear-gradient(155deg, #fff8e9 0%, #f7e9f2 52%, #e7f5f5 100%)",
    vars: {
      bg: "#fff8ec", bg2: "#fff0df", surface: "#fffdf8", elevated: "#ffffff",
      content: "#413748", muted: "#85798d", line: "#eadbd4", accent: "#e87563", accent2: "#63aebb",
    },
  },
  {
    id: "sakura",
    name: "Sakura",
    family: "renk",
    description: "Kiraz çiçeği pembesi ve mürekkep tonları",
    font: "rounded",
    wallpaper:
      "radial-gradient(900px 520px at 84% 8%, rgba(242,157,184,0.34), transparent 64%), radial-gradient(720px 520px at 12% 90%, rgba(185,135,205,0.18), transparent 62%), linear-gradient(155deg, #fff5f5 0%, #f9e9ef 52%, #f1eafa 100%)",
    vars: {
      bg: "#fbf0f4", bg2: "#f5e5ec", surface: "#fff9fb", elevated: "#ffffff",
      content: "#392b3b", muted: "#8c7184", line: "#ead3df", accent: "#c64f78", accent2: "#8171bd",
    },
  },
  {
    id: "kobalt",
    name: "Kobalt Neon",
    family: "renk",
    description: "Bilim kurgu gecesi: kobalt, elektrik limonu ve mint",
    font: "display",
    wallpaper:
      "radial-gradient(900px 560px at 82% 18%, rgba(80,104,255,0.24), transparent 64%), radial-gradient(760px 520px at 12% 92%, rgba(205,255,67,0.10), transparent 64%), linear-gradient(155deg, #080a20 0%, #101737 54%, #080d1c 100%)",
    vars: {
      bg: "#090c22", bg2: "#111833", surface: "#171f40", elevated: "#202a50",
      content: "#f0f3ff", muted: "#a2accd", line: "#303d68", accent: "#d2ff56", accent2: "#4bd8c3",
    },
  },

  /* ---------------- Yazı stilli ---------------- */
  {
    id: "sepya",
    name: "Sepya",
    family: "yazi",
    description: "Kitap sayfası: sıcak kağıt + serif yazı",
    font: "serif",
    vars: {
      bg: "#f6efe3", bg2: "#efe6d6", surface: "#fffaf0", elevated: "#fffaf0",
      content: "#3a3226", muted: "#8a7c66", line: "#e0d3bd", accent: "#b5651d", accent2: "#a0522d",
    },
  },
  {
    id: "daktilo",
    name: "Daktilo",
    family: "yazi",
    description: "Eşaralıklı (mono) yazı tipi, sıcak vurgu",
    font: "mono",
    vars: {
      bg: "#14161a", bg2: "#191c21", surface: "#1e2228", elevated: "#242a31",
      content: "#e6e8ea", muted: "#9aa3ad", line: "#2e343c", accent: "#e0a458", accent2: "#c9c9c9",
    },
  },
  {
    id: "kagit",
    name: "Kağıt",
    family: "yazi",
    description: "Aydınlık + serif; uzun okuma için",
    font: "serif",
    vars: {
      bg: "#fbfaf7", bg2: "#f4f2ec", surface: "#ffffff", elevated: "#ffffff",
      content: "#22201c", muted: "#6f6a60", line: "#e6e2d8", accent: "#8a6d3b", accent2: "#b08968",
    },
  },

  /* ---------------- Sinematik (görsel destekli) ---------------- */
  {
    id: "uzay",
    name: "Uzay",
    family: "sinematik",
    description: "Interstellar'daki Gargantua'dan ilham alan derin uzay atmosferi",
    font: "display",
    image: IMG("interstellar"),
    wallpaper:
      "radial-gradient(1000px 650px at 50% 48%, rgba(255,112,28,0.18), transparent 58%), radial-gradient(900px 600px at 14% 85%, rgba(178,48,35,0.12), transparent 62%), linear-gradient(180deg, #05060d 0%, #100c12 55%, #05060a 100%)",
    vars: {
      bg: "rgba(7,8,14,0.87)", bg2: "rgba(17,13,18,0.85)", surface: "rgba(27,19,22,0.87)",
      elevated: "rgba(38,25,25,0.93)", content: "#fff1e4", muted: "#c9a58f",
      line: "rgba(245,151,77,0.22)", accent: "#ff9d4d", accent2: "#e96d55",
    },
  },
  {
    id: "kum",
    name: "Kum Fırtınası",
    family: "sinematik",
    description: "Çöl kumulları ve amber tonlar",
    font: "display",
    image: IMG("kum"),
    wallpaper:
      "radial-gradient(1000px 600px at 75% 15%, rgba(255,170,80,0.30), transparent 62%), linear-gradient(180deg, #1c1208 0%, #2a1b0d 55%, #120b05 100%)",
    vars: {
      bg: "rgba(28,18,10,0.86)", bg2: "rgba(36,24,14,0.84)", surface: "rgba(44,30,18,0.86)",
      elevated: "rgba(52,36,22,0.92)", content: "#f7ecdd", muted: "#c2a583",
      line: "rgba(210,160,100,0.22)", accent: "#f0a44e", accent2: "#ffcf7a",
    },
  },
  {
    id: "kuzey",
    name: "Kuzey Işıkları",
    family: "sinematik",
    description: "Yeşil-mor aurora gökyüzü",
    font: "sans",
    image: IMG("kuzey"),
    wallpaper:
      "radial-gradient(1100px 600px at 25% 20%, rgba(80,230,180,0.26), transparent 62%), radial-gradient(900px 600px at 80% 85%, rgba(150,110,255,0.22), transparent 60%), linear-gradient(180deg, #050f14 0%, #08181c 60%, #040a0d 100%)",
    vars: {
      bg: "rgba(5,14,18,0.86)", bg2: "rgba(8,22,26,0.84)", surface: "rgba(11,29,33,0.86)",
      elevated: "rgba(15,36,40,0.92)", content: "#e6fbf4", muted: "#8fc4b8",
      line: "rgba(90,190,170,0.22)", accent: "#4fe0b0", accent2: "#9d7cff",
    },
  },
  {
    id: "neon",
    name: "Neon Şehir",
    family: "sinematik",
    description: "Yağmurlu neon sokaklar, cyberpunk",
    font: "display",
    image: IMG("neon-cinematic"),
    wallpaper:
      "radial-gradient(900px 600px at 20% 15%, rgba(255,90,200,0.28), transparent 60%), radial-gradient(900px 600px at 85% 80%, rgba(90,230,255,0.24), transparent 60%), linear-gradient(180deg, #0a0616 0%, #150a24 55%, #07040f 100%)",
    vars: {
      bg: "rgba(6,10,22,0.87)", bg2: "rgba(10,17,33,0.85)", surface: "rgba(16,22,43,0.87)",
      elevated: "rgba(24,29,52,0.93)", content: "#f1f5ff", muted: "#9fb4d4",
      line: "rgba(104,191,225,0.22)", accent: "#fa67c8", accent2: "#54d8ee",
    },
  },
  {
    id: "yagmur",
    name: "Yağmurlu Pencere",
    family: "sinematik",
    description: "Sisin ve yağmurun huzuru",
    font: "sans",
    image: IMG("yagmur-cinematic"),
    wallpaper:
      "radial-gradient(1000px 600px at 30% 20%, rgba(140,180,220,0.20), transparent 62%), linear-gradient(180deg, #0a0e14 0%, #131a24 60%, #070a0f 100%)",
    vars: {
      bg: "rgba(8,13,20,0.87)", bg2: "rgba(13,21,31,0.85)", surface: "rgba(19,29,41,0.87)",
      elevated: "rgba(26,38,52,0.93)", content: "#edf5fb", muted: "#9db4c6",
      line: "rgba(119,174,204,0.20)", accent: "#78bad5", accent2: "#b2d2df",
    },
  },
  {
    id: "gunbatimi",
    name: "Gün Batımı",
    family: "sinematik",
    description: "Altın turuncu gün batımı ve sıcak akşam tonları",
    font: "serif",
    image: IMG("gunbatimi"),
    wallpaper:
      "radial-gradient(1000px 600px at 70% 20%, rgba(255,159,63,0.28), transparent 62%), radial-gradient(900px 600px at 15% 85%, rgba(224,91,37,0.18), transparent 60%), linear-gradient(180deg, #1a100a 0%, #28170e 55%, #100a07 100%)",
    vars: {
      bg: "rgba(24,15,9,0.87)", bg2: "rgba(35,21,12,0.85)", surface: "rgba(48,29,16,0.87)",
      elevated: "rgba(59,36,19,0.93)", content: "#fff3df", muted: "#d1ae81",
      line: "rgba(245,174,91,0.22)", accent: "#ff9a45", accent2: "#ffd166",
    },
  },
];

export const DEFAULT_THEME_ID = "gece";

export function getTheme(id: string | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Temanın tüm CSS değişkenleri (tek kaynak: hem canlı uygulama hem ön-bellek) */
export function themeCssVars(theme: Theme): Record<string, string> {
  const v = theme.vars;
  const wallpaper = theme.image
    ? `${theme.image}, ${theme.wallpaper ?? ""}`
    : (theme.wallpaper ?? "");
  return {
    "--bg": v.bg,
    "--bg-solid": themeSolidBg(theme),
    "--bg-2": v.bg2,
    "--surface": v.surface,
    "--elevated": v.elevated,
    "--content": v.content,
    "--muted": v.muted,
    "--line": v.line,
    "--line-soft": v.line,
    "--accent": v.accent,
    "--accent-2": v.accent2,
    "--accent-soft": `color-mix(in srgb, ${v.accent} 22%, transparent)`,
    "--accent-fg": themeSolidBg(theme),
    "--font-sans": FONT_STACKS[theme.font],
    "--wallpaper": wallpaper || "none",
    "--wallpaper-opacity": wallpaper ? "1" : "0",
    // Fotoğraflı temalarda sayfa içeriğinin kontrastını koru; görsel atmosferi
    // görünür kalırken parlak noktalar metin ve kontrollerin arkasını bastırmasın.
    "--wallpaper-overlay": theme.family === "sinematik" ? "rgba(4, 9, 16, 0.48)" : "transparent",
    "--wallpaper-size": theme.wallpaperMotion ? "220% 220%" : "cover",
    "--wallpaper-motion": theme.wallpaperMotion ? "wallpaper-drift 42s ease-in-out infinite alternate" : "none",
  };
}

export const THEME_CACHE_KEY = "bateo:theme";

/** Temayı localStorage'a yaz → sonraki açılışta ilk boyamadan önce uygulanır (flash yok) */
export function cacheTheme(theme: Theme): void {
  try {
    localStorage.setItem(
      THEME_CACHE_KEY,
      JSON.stringify({ id: theme.id, dark: themeIsDark(theme), vars: themeCssVars(theme) }),
    );
  } catch {
    /* yoksay */
  }
}

/** Tema koyu mu? (bg renginin parlaklığına göre) */
export function themeIsDark(t: Theme): boolean {
  const rgba = t.vars.bg.match(/rgba?\(([^)]+)\)/);
  if (rgba) {
    const [r, g, b] = rgba[1].split(",").map((n) => parseFloat(n));
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
  }
  const hex = t.vars.bg.replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

/** Temanın saydam arka planından opak bir taban rengi üretir (tarayıcıda boşluk görünmesin) */
export function themeSolidBg(t: Theme): string {
  const rgb = t.vars.bg.match(/rgba?\(([^)]+)\)/);
  if (rgb) {
    const [r, g, b] = rgb[1].split(",").map((n) => Math.round(parseFloat(n)));
    return `rgb(${r}, ${g}, ${b})`;
  }
  return t.vars.bg;
}
