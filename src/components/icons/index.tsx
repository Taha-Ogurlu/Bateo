import type { CSSProperties } from "react";

/**
 * BATEO ikon seti
 * Kaynak: "Planlayıcı İkon Seti" (24x24, 1.75 çizgi, yuvarlak uçlar, currentColor)
 * Her ikon bir `slug` (kod içinde kullanılır) ve `label` (Türkçe ad) barındırır.
 */

export type IconDef = { slug: string; label: string; body: string };

export const ICONS: IconDef[] = [
  // ---- Zaman ve Takvim ----
  { slug: "calendar", label: "Takvim", body: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>` },
  { slug: "calendar-check", label: "Takvim Onay", body: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4m-7 12 2 2 4-4"/>` },
  { slug: "calendar-plus", label: "Takvim Ekle", body: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/>` },
  { slug: "calendar-week", label: "Haftalık", body: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h.01M12 14h.01M17 14h.01M7 17.5h.01M12 17.5h.01"/>` },
  { slug: "calendar-today", label: "Bugün", body: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="12" cy="15.5" r="2"/>` },
  { slug: "clock", label: "Saat", body: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>` },
  { slug: "stopwatch", label: "Kronometre", body: `<circle cx="12" cy="13" r="8"/><path d="M12 9v4M9 2h6M12 2v3"/>` },
  { slug: "hourglass", label: "Kum Saati", body: `<path d="M6 3h12M6 21h12M7 3v4l5 5-5 5v4M17 3v4l-5 5 5 5v4"/>` },
  { slug: "alarm", label: "Alarm", body: `<circle cx="12" cy="13" r="7"/><path d="M12 10v3l2 2M4 5l3-2M20 5l-3-2"/>` },
  { slug: "bell", label: "Hatırlatıcı", body: `<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>` },
  { slug: "repeat", label: "Tekrar", body: `<path d="m17 2 3 3-3 3M20 5H8a4 4 0 0 0-4 4v1M7 22l-3-3 3-3M4 19h12a4 4 0 0 0 4-4v-1"/>` },
  { slug: "pomodoro", label: "Pomodoro", body: `<circle cx="12" cy="14" r="7"/><path d="M12 7c0-2 1-4 3-4M12 7c-1-1-3-1-4 0M12 11v3h3"/>` },
  { slug: "deadline", label: "Son Tarih", body: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5M12 16h.01"/>` },
  { slug: "break", label: "Mola", body: `<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h2a2 2 0 0 1 0 4h-2M7 3v3M11 3v3"/>` },
  { slug: "sunrise", label: "Sabah", body: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>` },
  { slug: "sunset", label: "Akşam", body: `<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>` },

  // ---- Ders ve Okul ----
  { slug: "book", label: "Kitap", body: `<path d="M5 4h13v16H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11M9 8h6"/>` },
  { slug: "book-open", label: "Açık Kitap", body: `<path d="M12 6c-2-1.5-5-2-9-2v14c4 0 7 .5 9 2 2-1.5 5-2 9-2V4c-4 0-7 .5-9 2zM12 6v14"/>` },
  { slug: "graduation", label: "Mezuniyet", body: `<path d="m2 9 10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5M22 9v6"/>` },
  { slug: "school", label: "Okul", body: `<path d="M3 21h18M5 21V10l7-5 7 5v11M10 21v-5h4v5"/>` },
  { slug: "timetable", label: "Ders Programı", body: `<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11M3 14.5h18"/>` },
  { slug: "pencil", label: "Kalem", body: `<path d="m4 20 1-4L16 5l3 3L8 19zM14 7l3 3"/>` },
  { slug: "ruler", label: "Cetvel", body: `<rect x="2" y="8" width="20" height="8" rx="1.5"/><path d="M6 8v3M10 8v4M14 8v3M18 8v4"/>` },
  { slug: "calculator", label: "Hesap Makinesi", body: `<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18.5h.01M12 18.5h.01M16 18.5h.01"/>` },
  { slug: "lab", label: "Laboratuvar", body: `<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M8 15h8"/>` },
  { slug: "atom", label: "Atom", body: `<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-60 12 12)"/>` },
  { slug: "globe", label: "Coğrafya", body: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>` },
  { slug: "math", label: "Matematik", body: `<path d="M4 6h6M7 3v6M14 7h6M5 18l5-5M10 18l-5-5M14 15h6M14 19h6"/>` },
  { slug: "language", label: "Dil", body: `<path d="M4 5h16v11h-9l-5 4v-4H4z"/>` },
  { slug: "art", label: "Sanat", body: `<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2-.6-1.2.2-2.5 1.5-2.5H18a3 3 0 0 0 3-3c0-5-4-10.5-9-10.5zM7.5 11h.01M10 7h.01M15 7h.01"/>` },
  { slug: "music", label: "Müzik", body: `<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>` },
  { slug: "sport", label: "Spor", body: `<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>` },
  { slug: "code", label: "Kodlama", body: `<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>` },
  { slug: "exam", label: "Sınav", body: `<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16l1.5 1.5L14 14"/>` },
  { slug: "homework", label: "Ödev", body: `<path d="M5 4h14v17H5zM9 2v4M15 2v4M9 11h6M9 15h4"/>` },
  { slug: "notebook", label: "Defter", body: `<rect x="6" y="3" width="14" height="18" rx="2"/><path d="M2 8h4M2 12h4M2 16h4M11 8h5M11 12h5"/>` },
  { slug: "backpack", label: "Çanta", body: `<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>` },
  { slug: "board", label: "Tahta", body: `<rect x="3" y="4" width="18" height="12" rx="1"/><path d="m8 20 4-4 4 4M7 9h6M7 12h4"/>` },
  { slug: "group", label: "Grup Çalışma", body: `<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 3-6 6-6s6 2.5 6 6M16 5a3 3 0 0 1 0 6M18 14c2 .8 3 3 3 6"/>` },
  { slug: "library", label: "Kütüphane", body: `<path d="M4 4h4v16H4zM10 4h4v16h-4zM16 6l4 1-3.5 13-4-1z"/>` },

  // ---- Görevler ----
  { slug: "box", label: "Kutu", body: `<rect x="4" y="4" width="16" height="16" rx="3"/>` },
  { slug: "checkbox", label: "İşaretli Kutu", body: `<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8.5 12 2.5 2.5 4.5-5"/>` },
  { slug: "list-todo", label: "Yapılacaklar", body: `<path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>` },
  { slug: "task-plus", label: "Görev Ekle", body: `<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>` },
  { slug: "check-circle", label: "Tamamlandı", body: `<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>` },
  { slug: "progress-circle", label: "Devam Ediyor", body: `<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z"/>` },
  { slug: "pause", label: "Bekliyor", body: `<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>` },
  { slug: "cancel", label: "İptal", body: `<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>` },
  { slug: "priority", label: "Öncelik", body: `<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>` },
  { slug: "star", label: "Favori", body: `<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>` },
  { slug: "target", label: "Hedef", body: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>` },
  { slug: "trophy", label: "Kupa", body: `<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 21h8M9 18h6"/>` },
  { slug: "badge", label: "Rozet", body: `<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/>` },
  { slug: "streak", label: "Seri", body: `<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 1-3 0-6 1-9z"/>` },
  { slug: "subtask", label: "Alt Görev", body: `<path d="M5 4v11a3 3 0 0 0 3 3h3M5 9h6M14 9h6M14 18h6"/>` },
  { slug: "drag", label: "Sürükle", body: `<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke-width="3"/>` },

  // ---- Notlar ----
  { slug: "note", label: "Not", body: `<path d="M5 3h10l4 4v14H5zM15 3v4h4M8 12h8M8 16h6"/>` },
  { slug: "sticky", label: "Yapışkan Not", body: `<path d="M4 4h16v10l-6 6H4zM14 20v-6h6M8 9h8"/>` },
  { slug: "pin", label: "Raptiye", body: `<path d="M9 3h6l-1 6 3 3v2H7v-2l3-3zM12 14v7"/>` },
  { slug: "bookmark", label: "Yer İmi", body: `<path d="M6 3h12v18l-6-4-6 4z"/>` },
  { slug: "tag", label: "Etiket", body: `<path d="M3 12V4h8l10 10-8 8zM7.5 8h.01"/>` },
  { slug: "attachment", label: "Ek Dosya", body: `<path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7"/>` },
  { slug: "link", label: "Bağlantı", body: `<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>` },
  { slug: "voice", label: "Sesli Not", body: `<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>` },
  { slug: "photo", label: "Fotoğraf", body: `<rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="12" cy="12.5" r="3.5"/><path d="m8 5 1-2h6l1 2"/>` },
  { slug: "highlight", label: "Vurgulayıcı", body: `<path d="m14 4 6 6-8 8H6v-6zM4 21h6"/>` },
  { slug: "bullet-list", label: "Madde Listesi", body: `<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>` },
  { slug: "archive", label: "Arşiv", body: `<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11h14V8M10 12h4"/>` },
  { slug: "folder", label: "Klasör", body: `<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>` },

  // ---- Arayüz ----
  { slug: "home", label: "Ana Sayfa", body: `<path d="m3 11 9-8 9 8M5 10v10h14V10M10 20v-6h4v6"/>` },
  { slug: "search", label: "Ara", body: `<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>` },
  { slug: "filter", label: "Filtre", body: `<path d="M3 5h18l-7 8v6l-4 2v-8z"/>` },
  { slug: "sort", label: "Sırala", body: `<path d="M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3"/>` },
  { slug: "settings", label: "Ayarlar", body: `<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>` },
  { slug: "gear", label: "Dişli", body: `<circle cx="12" cy="12" r="3"/><path d="m12 3 2 2.5 3-.5.5 3 2.5 2-1.5 2.5 1.5 2.5-2.5 2-.5 3-3-.5L12 21l-2-2.5-3 .5-.5-3L4 14l1.5-2.5L4 9l2.5-2 .5-3 3 .5z"/>` },
  { slug: "profile", label: "Profil", body: `<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7"/>` },
  { slug: "mail", label: "E-posta", body: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>` },
  { slug: "sparkles", label: "Parıltı", body: `<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>` },
  { slug: "menu", label: "Menü", body: `<path d="M4 6h16M4 12h16M4 18h16"/>` },
  { slug: "more", label: "Daha Fazla", body: `<path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="3"/>` },
  { slug: "plus", label: "Artı", body: `<path d="M12 5v14M5 12h14"/>` },
  { slug: "close", label: "Kapat", body: `<path d="m6 6 12 12M18 6 6 18"/>` },
  { slug: "check", label: "Onay", body: `<path d="m5 12 5 5L20 7"/>` },
  { slug: "chevron-left", label: "Sol", body: `<path d="m15 5-7 7 7 7"/>` },
  { slug: "chevron-right", label: "Sağ", body: `<path d="m9 5 7 7-7 7"/>` },
  { slug: "chevron-up", label: "Yukarı", body: `<path d="m5 15 7-7 7 7"/>` },
  { slug: "chevron-down", label: "Aşağı", body: `<path d="m5 9 7 7 7-7"/>` },
  { slug: "trash", label: "Sil", body: `<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>` },
  { slug: "edit", label: "Düzenle", body: `<path d="M11 5H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-6M18 3l3 3-9 9H9v-3z"/>` },
  { slug: "copy", label: "Kopyala", body: `<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>` },
  { slug: "share", label: "Paylaş", body: `<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>` },
  { slug: "download", label: "İndir", body: `<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>` },
  { slug: "upload", label: "Yükle", body: `<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>` },
  { slug: "sync", label: "Senkron", body: `<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>` },
  { slug: "lock", label: "Kilit", body: `<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>` },
  { slug: "eye", label: "Göster", body: `<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>` },
  { slug: "eye-off", label: "Gizle", body: `<path d="m3 3 18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M6.7 6.7A10.6 10.6 0 0 0 2.5 12s3.5 6 9.5 6a10.4 10.4 0 0 0 4.3-.9"/><path d="M9.9 4.3A10.6 10.6 0 0 1 12 4c6 0 9.5 8 9.5 8a16.6 16.6 0 0 1-3 4"/>` },
  { slug: "info", label: "Bilgi", body: `<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>` },
  { slug: "warning", label: "Uyarı", body: `<path d="M12 3 2 20h20zM12 10v4M12 17h.01"/>` },

  // ---- Analiz ve Yaşam ----
  { slug: "bar-chart", label: "Sütun Grafik", body: `<path d="M5 20v-9M12 20V4M19 20v-6"/>` },
  { slug: "line-chart", label: "Çizgi Grafik", body: `<path d="M3 3v18h18M7 15l4-4 3 3 5-6"/>` },
  { slug: "pie-chart", label: "Pasta Grafik", body: `<path d="M12 3v9h9a9 9 0 1 1-9-9zM15 3a9 9 0 0 1 6 6h-6z"/>` },
  { slug: "progress", label: "İlerleme", body: `<rect x="3" y="9" width="18" height="6" rx="3"/><path d="M6 12h6"/>` },
  { slug: "template", label: "Şablon", body: `<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/>` },
  { slug: "dashboard", label: "Panel", body: `<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>` },
  { slug: "location", label: "Konum", body: `<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>` },
  { slug: "idea", label: "Fikir", body: `<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 11c.6.5 1 1.2 1 2h5c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>` },
  { slug: "focus", label: "Odaklan", body: `<path d="M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H5a1 1 0 0 1-1-1zM20 15h-3v5h2a1 1 0 0 0 1-1z"/>` },
  { slug: "phone", label: "Telefon", body: `<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>` },
  { slug: "sleep", label: "Uyku", body: `<path d="M4 6h5l-5 6h5M13 12h4l-4 5h4"/>` },
  { slug: "water", label: "Su", body: `<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>` },
  { slug: "food", label: "Yemek", body: `<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v6M9 3v6M17 21V3c-3 1-4 4-4 8h4"/>` },
  { slug: "transport", label: "Ulaşım", body: `<rect x="4" y="3" width="16" height="15" rx="2"/><path d="M4 11h16M8 21v-3M16 21v-3M8 15h.01M16 15h.01"/>` },
];

const MAP: Record<string, string> = Object.fromEntries(ICONS.map((i) => [i.slug, i.body]));

export interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
  /** İç dolgu rengi (örn. "currentColor") — varsayılan yok (çizgi ikon) */
  fill?: string;
  /** Erişilebilirlik için etiket; verilmezse dekoratif sayılır */
  title?: string;
}

export function Icon({ name, size = 20, strokeWidth = 1.75, className, style, fill, title }: IconProps) {
  const body = MAP[name];
  if (!body) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={fill ?? "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
