# BATEO — Öğrenci Merkezi

Ders çalışma, not alma ve planlama için tasarlanmış, **offline-first** masaüstü + mobil uygulama.
Veriler cihazda IndexedDB'de saklanır; Supabase yapılandırılmışsa hesabınla cihazlar arasında eşitlenir.

## Özellikler

- 🏠 **Ana Sayfa** — günlük özet, seri (streak), yaklaşan sınav geri sayımı, haftalık odak grafiği, hızlı not
- 📝 **Notlar** — **zengin editör** (biçimlendirme, renk, vurgu, liste, alıntı, kod, görsel), **klasör yönetimi**, arama, sabitleme/favori/arşiv
- ✅ **Görevler** — liste, Kanban panosu ve **Takvim (aylık planlayıcı)**; öncelik, teslim tarihi, alt görevler
- 📅 **Ders Programı** — haftalık ders programı, sınavlar (**geri sayım + takvim**), ders yönetimi
- ⏱️ **Odak** — Pomodoro zamanlayıcı, **ayarlanabilir süreler**, duraklat/devam, **gün gün odak geçmişi**
- 🎴 **Kartlar** — soru-cevap desteleri, **aralıklı tekrar (SM-2)**, çalışma seansı
- 📚 **Kitaplar** — okuma listesi; kitap içinde **beğendiğin sözler** ve **kitap sonu düşüncen**
- 🔔 **Bildirimler** — görev özeti, sınav hatırlatıcı, odak bitişi (masaüstü + mobil)
- 📊 **İstatistik** — haftalık grafikler, ders dağılımı, çalışma ısı haritası
- 🎨 **Temalar** — renk, yazı tipi ve sinematik arka plan seçenekleri
- ⌨️ **Komut paleti** (`Ctrl+K`), hızlı ekle (`Ctrl+J`)
- 💾 **Yerel veri** (IndexedDB) + JSON yedekleme/geri yükleme

## Teknolojiler

React 19 · TypeScript · Vite 8 · TailwindCSS 4 · Radix UI · Framer Motion · Dexie (IndexedDB) · Recharts · Electron

## Web uygulaması (PWA) — PC'ye kurulum

```powershell
npm.cmd run web        # derle + sun (http://localhost:4173) + tarayıcıyı aç
```

1. Tarayıcıda (Edge/Chrome) **adres çubuğundaki "Yükle" (⊕ / kur) simgesine** tıkla → **Yükle**
   (veya `⋮` menü → **Uygulamalar → Bu siteyi yükle**)
2. Uygulama **Başlat menüsüne ve masaüstüne** kısayol olarak eklenir
3. Bundan sonra normal bir uygulama gibi açılır ve **çevrimdışı da çalışır**

> Sunucu yalnızca **ilk kurulum** ve güncellemeler için gerekir; kurulduktan sonra önbellekten açılır.
> Daha sonra sunucuyu çalıştırmak için: `npm.cmd run web:serve`

## Kurulum ve Çalıştırma

> Supabase bulut ayarları eklenmişse uygulama hesap oluşturmanı veya giriş yapmanı ister.
> Bulut ayarları yoksa uygulama hesap olmadan yerel modda çalışır.
> İlk açılışta tanıtım ve profil kurulumu gösterilir.

```bash
npm.cmd install              # bağımlılıklar
npm.cmd run dev               # tarayıcıda geliştirme (http://localhost:5173)
npm.cmd run electron:dev      # masaüstü pencerede geliştirme
npm.cmd run build             # üretim derlemesi (dist/)
npm.cmd run electron:build    # Windows kurulum dosyası (release/)
```

> PowerShell'de `npm` yerine `npm.cmd` kullanman gerekebilir.

## Klavye Kısayolları

| Kısayol | İşlev |
| --- | --- |
| `Ctrl + K` | Komut paleti / arama |
| `Ctrl + J` | Hızlı ekle |
| `Esc` | Açık paneli kapat |

## Platformlar

- **Web/PWA:** kurulabilir ve service worker önbelleğiyle çevrimdışı açılabilir.
- **Windows:** Electron masaüstü uygulaması.
- **Android:** Capacitor ile APK üretilebilir; `scripts/build-apk.ps1` JDK ve Android SDK yollarını otomatik bulur. Android Studio zorunlu değildir.

## Mobil (Android)

```powershell
npm.cmd run assets       # logo'dan ikon/splash PNG üret (assets/)
npm.cmd run cap:sync     # web derle + Android'e kopyala
npm.cmd run android:apk  # APK üret → android/app/build/outputs/apk/debug/app-debug.apk
npm.cmd run cap:open     # (isteğe bağlı) Android Studio'yu aç → Run ▶
```

Gereksinim: **JDK 17+** ve **Android SDK** (platform-tools, platforms;android-36, build-tools;36.0.0).
Android Studio şart değildir; `scripts/build-apk.ps1` yolları otomatik bulur.
APK çıktısı: `android/app/build/outputs/apk/debug/app-debug.apk`
- **v3.0** İhtişam & derinleşme — sınav takvimi, flashcard/aralıklı tekrar, oyunlaştırma, psikoloji paketi

## Yapı

```
src/
├── components/    ui, icons, layout, auth, rich editor
├── modules/       dashboard, notes, tasks, schedule, focus, cards, books, stats, settings
├── db/            Dexie veritabanı, Supabase senkronu ve veri bakımı
├── lib/           yardımcılar (tarih, renk, istatistik)
└── hooks/         useSettings, useMediaQuery
electron/          masaüstü kabuğu (main + preload)
```
