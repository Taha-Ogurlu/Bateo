/** Renk yardımcıları — vurgu rengi teması için */

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return "#" + [c(r), c(g), c(b)].map((n) => n.toString(16).padStart(2, "0")).join("");
}

export function rgba(hex: string, a: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function mix(a: string, b: string, t = 0.5): string {
  const c1 = hexToRgb(a);
  const c2 = hexToRgb(b);
  return rgbToHex(c1.r + (c2.r - c1.r) * t, c1.g + (c2.g - c1.g) * t, c1.b + (c2.b - c1.b) * t);
}

export function lighten(hex: string, amount: number): string {
  return mix(hex, "#ffffff", amount);
}

export function darken(hex: string, amount: number): string {
  return mix(hex, "#000000", amount);
}

/** Parlaklığa göre okunabilir metin rengi */
export function readableOn(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#0d0f16" : "#ffffff";
}

/** Vurgu renginden türetilen tema değişkenleri */
export function accentVars(hex: string): { accent: string; accent2: string; soft: string } {
  return {
    accent: hex,
    accent2: mix(hex, "#c084fc", 0.45),
    soft: rgba(hex, 0.16),
  };
}

export const ACCENT_PRESETS: { name: string; value: string }[] = [
  { name: "Indigo", value: "#8ea0ff" },
  { name: "Menekşe", value: "#b48cff" },
  { name: "Turkuaz", value: "#4fd1c5" },
  { name: "Yeşil", value: "#3dd68c" },
  { name: "Amber", value: "#ffb224" },
  { name: "Gül", value: "#ff7aa2" },
  { name: "Mercan", value: "#ff6369" },
  { name: "Gökyüzü", value: "#54a9ff" },
];
