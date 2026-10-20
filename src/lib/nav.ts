/** Uygulama navigasyonu */

export interface NavItem {
  to: string;
  label: string;
  icon: string;
  /** Mobil alt bar'da göster */
  mobile?: boolean;
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Ana Sayfa", icon: "home", mobile: true, end: true },
  { to: "/notlar", label: "Notlar", icon: "note", mobile: true },
  { to: "/gorevler", label: "Görevler", icon: "list-todo", mobile: true },
  { to: "/program", label: "Program", icon: "timetable", mobile: true },
  { to: "/odak", label: "Odak", icon: "pomodoro", mobile: true },
  { to: "/kartlar", label: "Kartlar", icon: "bookmark" },
  { to: "/kitaplar", label: "Kitaplar", icon: "book" },
  { to: "/istatistik", label: "İstatistik", icon: "bar-chart" },
  { to: "/hesabim", label: "Hesabım", icon: "profile" },
  { to: "/ayarlar", label: "Ayarlar", icon: "settings" },
];

export const MOBILE_NAV = NAV_ITEMS.filter((i) => i.mobile);

/** Mobil "Daha fazla" menüsündeki bölümler */
export const MORE_NAV = NAV_ITEMS.filter((i) => !i.mobile);
