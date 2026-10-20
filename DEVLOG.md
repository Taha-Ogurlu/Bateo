# BATEO — Geliştirici Notları (DEVLOG)

> Bu dosya, geliştirmeyi başka bir oturumda kaldığı yerden sürdürebilmek için tutulur.
> Son güncelleme: v1.1 çalışması sırasında.

## Proje Özeti

**BATEO** — üniversite öğrencisi için offline-first çalışma/planlama merkezi (masaüstü + mobil hedefli).
Kullanıcı psikoloji okuyor; örnek veriler psikoloji temalı.

- Konum: `C:\Users\ogurl\OneDrive\Desktop\BATEO`
- Dil: arayüz **sadece Türkçe**
- AI entegrasyonu **yok** (kullanıcı istemedi)
- Tasarım: koyu tema varsayılan + 8 vurgu rengi, cam efekt, akıcı animasyonlar
- İkonlar: kullanıcının verdiği "Planlayıcı İkon Seti" (110 ikon) → `src/components/icons/index.tsx`

## Teknoloji

React 19 · TypeScript 6 · Vite 8 (Rolldown) · TailwindCSS 4 · Radix UI · Framer Motion ·
Dexie (IndexedDB) · Recharts · TipTap 3 (zengin not editörü) · Electron 44 · electron-builder

## Önemli Kararlar / Tuzaklar (KORU!)

1. **`npm` yerine `npm.cmd`** kullan (PowerShell script policy kapalı).
2. **Electron'da `file://` KULLANMA** → ES modülleri CORS'a takılır, app açılmaz.
   Çözüm: `electron/app-protocol.cjs` → `app://bateo/index.html` özel protokolü + CSP.
3. **Dexie `useLiveQuery` içinde YAZMA YAPMA** → `ReadOnlyError` fırlatır.
   `getSettings()` salt-okunur; yazma ayrı `ensureSettings()/updateSettings()`.
4. **Not içeriği artık HTML** (TipTap). Eski markdown notlar `migrateNotesToHtml()` ile HTML'e çevrilir.
5. Build `base: "./"` (Electron uyumu). Router: **HashRouter**.
6. Kod bölme: modüller `React.lazy` ile tembel yükleniyor.

## Klasör/Modül Haritası

```
electron/
  main.cjs            # pencere + dev/prod yükleme
  preload.cjs         # contextBridge (window.bateo)
  app-protocol.cjs    # app:// protokolü + CSP başlığı
scripts/
  smoke.cjs           # duman testi (npm run smoke)
  smoke-preload.cjs
src/
  App.tsx             # HashRouter + lazy modüller + global kısayollar (Ctrl+K, Ctrl+J)
  main.tsx            # ErrorBoundary + App
  index.css           # tema tokenları, glass, markdown stilleri, animasyonlar
  components/
    icons/index.tsx   # 110 ikon (slug'lar: calendar, note, list-todo, pomodoro, ...)
    ui/               # Button, Card, Field, Badge, Modal, Controls(Switch/Checkbox/Slider/Select), Tabs, Tooltip, misc(Progress,ProgressRing,EmptyState,Kbd,SectionTitle)
    layout/           # Sidebar, TopBar, BottomNav, AppLayout, CommandPalette, QuickAdd, Onboarding, Logo, PageLoader
    editor/RichEditor.tsx  # TipTap zengin editör
    Markdown.tsx      # (eski) marked+dompurify — notlar artık HTML
    ErrorBoundary.tsx
  db/
    db.ts             # Dexie şeması + DEFAULT_SETTINGS + getSettings/ensureSettings/updateSettings
    migrate.ts        # eski markdown notları HTML'e çevirir (tek seferlik)
  lib/                # cn, id, date, color, quotes, stats, nav
  hooks/              # useSettings, useMediaQuery
  modules/
    dashboard/Dashboard.tsx
    notes/Notes.tsx
    tasks/Tasks.tsx
    schedule/Schedule.tsx
    focus/Focus.tsx
    stats/Stats.tsx
    settings/SettingsPage.tsx
  store/ui.ts         # Zustand: sidebar, command palette, quick add
  types/index.ts      # Note, Task, Course, ClassSlot, FocusSession, Exam, Settings...
```

## Durum

### v1.0 (TAMAM)
Dashboard, Notlar, Görevler, Ders Programı, Odak/Pomodoro, İstatistik, Ayarlar, komut paleti,
karşılama, örnek veri, Electron kabuğu. `tsc` temiz, build temiz, `npm run smoke` EXIT 0.

### v1.1 (TAMAM) — kullanıcı istekleri
- [x] Notlar: **klasör ekle/sil/yeniden adlandır** (klasör yöneticisi modalı)
- [x] Notlar: **zengin editör** (TipTap 3 — forum-composer tarzı: P/H1-H3, kalın/italik/altı çizili/üstü çizili,
      yazı rengi, vurgu, madde/numaralı liste, alıntı, kod, link, görsel, hizalama, geri/yinele, biçim temizle)
- [x] Notlar: eski markdown notlar bir kez HTML'e göç ettirilir (`src/db/migrate.ts`)
- [x] Odak: çalışma/mola **±5 dk** ayarı (min 5) + **ayar modalı** + Ayarlar'a kısayol
- [x] Odak: **duraklat/devam hatası düzeltildi** — artık sıfırlanmıyor (efekt bağımlılığı düzeltildi)
- [x] Odak: **gün gün geçmiş** (son 14 gün, hangi gün ne kadar + hangi derse)
- [x] İstatistik: tooltip metni koyu temada görünür + Türkçe ("X dk odak")
- [x] İstatistik: "derslere göre çalışma" **Günlük/Haftalık/Aylık** sabit boyutlu geçiş
- [x] İstatistik: **ısı haritası** yeniden çizildi (Pazartesi başlangıç, gün/ay etiketleri, hover ipucu, açıklama)
- [x] Görevler: **Takvim (aylık planlayıcı)** görünümü — gün hücrelerinde görevler, güne tıkla → o güne görev ekle

### Test Betikleri
- `npm run smoke` → ana sayfa açılış testi (EXIT 0 = sağlıklı)
- `npm run smoke:editor` → Notlar + TipTap editör testi (EXIT 0 = sağlıklı)
- Farklı sayfa testi: `SMOKE_URL="app://bateo/index.html#/odak"` ortam değişkeniyle `npm run smoke`

### v1.1 düzeltme turu 2 (TAMAM)
- [x] Notlar: renk/vurgu seçicileri **hover yerine Popover** (tıklayınca açılır, seçim kaybolmaz),
      **2 satır × 5 = 10 renk**, "Rengi kaldır" + `onMouseDown preventDefault` (metin seçimi korunur)
- [x] Notlar: **sol liste gizle/göster** — editörün sol üstündeki ok ile; gizlenince editör genişler
- [x] İstatistik: **ısı haritası büyütüldü** — 26 hafta (6 ay), 18→20px kareler, ay + gün etiketleri,
      bugün halkası, özet (saat + aktif gün), açıklama
- NOT (Notlar paneli): görünürlük kuralı → mobilde sadece not seçili değilken, masaüstünde `listOpen` ise.

### Marka & cila (TAMAM)
- [x] **Gerçek logo/ikon entegre edildi** (`src/components/brand/Bateo.tsx`): `BateoIcon` + `BateoLogo`
      — renkler temaya duyarlı: gradyan `var(--accent)`→`var(--accent-2)`, "BATEO" yazısı `currentColor`
- [x] `layout/Logo.tsx` marka bileşenlerini kullanacak şekilde güncellendi (sidebar/üst bar/karşılama/ayarlar)
- [x] Yan menüdeki "öğrenci merkezi" alt yazısı **kaldırıldı** (daraltınca ikonlar kaymasın: logo ve ikon aynı yükseklikte)
- [x] `public/favicon.svg` yeni ikon + `prefers-color-scheme` ile koyu/açık uyumu
- [x] PageLoader marka ikonuyla güncellendi
- [x] **Isı haritası tam genişlik**: CSS grid + `aspect-square` → kareler kart genişliğine yayılıyor (masaüstünde ~33px),
      `min-w-[620px]` + yatay kaydırma (mobil), gün/ay etiketleri, bugün halkası, özet
- NOT (gelecek): electron-builder için Windows `.ico` (favicon.svg'den üretilecek) — v2 paketleme adımı
- NOT: 3 marka SVG'si DOM'da (sidebar tam logo, üst bar ikon, karşılama logosu) — `smoke` çıktısında `brandLogos` alanı

### v3.0 — Sıradaki özellikler (DEVAM EDİYOR)
Kullanıcı seçimi: Bildirimler + Sınav takvimi + Flashcard + Psikoloji paketi.

#### v3-a — Bildirimler & Hatırlatıcılar (TAMAM)
- [x] `@capacitor/local-notifications` + `src/lib/notify.ts` (izin, `notifyNow`, `scheduleAt`, native/web birleşik)
- [x] Ayarlar alanları: `notifyTasks`, `notifyExams`, `notifyPomodoro`, `reminderHour` (varsayılan 09:00)
- [x] `src/hooks/useReminders.ts`: günde bir görev özeti + sınav 7/1 gün kala (tekrar engelli, `meta.reminderLog`)
- [x] Odak (pomodoro) bitince bildirim
- [x] Ayarlar → **Bildirimler & Hatırlatıcılar** kartı (izin, test bildirimi, anahtarlar, saat)
- [x] Electron: `setAppUserModelId` + bildirim izni handler'ı
- [x] Test: `npm run test:reminders` → `meta.reminderLog["digest:..."]` yazılıyor (EXIT 0)

#### v3-b — Sınav Takvimi + Geri Sayım (TAMAM)
- [x] `src/hooks/useNow.ts` (canlı saat)
- [x] Sınavlar sekmesine **büyük geri sayım** (gün/saat/dakika/saniye) — en yakın sınav
- [x] **Sınav takvimi** (aylık, ders renkleriyle) — boş güne tıkla → o güne sınav ekle
- [x] `ExamModal` artık `defaultDate` alıyor

#### v3-c — Flashcard + Aralıklı Tekrar (SM-2) (TAMAM)
- [x] `lib/sm2.ts`: SM-2 algoritması (Tekrar/Zor/İyi/Kolay dereceleri, ease, interval, repetitions, lapses)
- [x] Türler: `Deck`, `Flashcard`; Dexie **v3** (`decks`, `flashcards`) + senkron listesine eklendi
- [x] `modules/cards/Cards.tsx`: deste listesi, deste detayı (kart ekle/düzenle/sil), **çalışma seansı** (soru→göster→4 derece), tur özeti
- [x] Navigasyon: **Kartlar** (sidebar) + mobil için **"Daha fazla" menüsü** (`MORE_NAV`, Modal ile)
- [x] Örnek deste (seed): "Öğrenme Kuramları" + 4 kart
- [x] Tip/build/smoke temiz

#### v3-d — Psikoloji Paketi (TAMAM)
- [x] Türler: `Concept`, `Paper`, `CaseNote`, `ScaleEntry`; Dexie **v4** + senkron listesi
- [x] `modules/psych/Psych.tsx` sekmeleri:
      **Kavramlar** (terim/tanım/kaynak/etiket + arama), **Makaleler** (durum filtreleri, notlar),
      **Vakalar** (zengin editör + gizlilik uyarısı), **Ölçekler** (puan kaydı + çubuk grafik + değişim)
- [x] Navigasyon: **Psikoloji** (sidebar + mobil "Daha fazla")
- [x] Sürüm → **3.0.0** (sidebar/ayarlar/README etiketleri güncellendi)
- NOT: Doğrulama — tip/build/smoke temiz; `test:cloud` ve `test:app:sync` DB v4 sonrası hâlâ yeşil; 0 lint hatası
- NOT (optimizasyon fırsatı): ana paket ~828 kB (200 kB'ı `supabase-js`). İleride supabase tembel yüklenebilir.
- NOT: `android/` hazır; APK derlemesi kullanıcı Android Studio kurunca yapılacak (en son adım).

#### v3.1 — Düzeltmeler & Kitap listesi (TAMAM)
- [x] **Renk titremesi düzeltildi**: `AppLayout` sayfa geçişi artık **yalnızca opaklık**
      (transform + çıkış animasyonu kaldırıldı). Sebep: AnimatePresence çıkışı içeriği karartıyordu;
      transform ise `backdrop-blur` ile birlikte titreme yapıyordu.
- [x] **Psikoloji paketi kaldırıldı** (UI + route + nav). Eski tablolar (`concepts/papers/caseNotes/scaleEntries`)
      veri kaybı olmasın diye şemada bırakıldı; senkron listesinden çıkarıldı.
- [x] **Kitap Okuma Listesi** (`modules/books/Books.tsx`, Dexie **v5**): kitaplar (Okunacak/Okunuyor/Okundu + 1-5 yıldız),
      kitap içinde **alıntılar** (söz + sayfa + not), **"Kitap sonu düşüncem"** (zengin editör + otomatik kaydetme)
- [x] Navigasyon: Psikoloji → **Kitaplar** (`book` ikonu); mobil "Daha fazla"da otomatik
- [x] Seed: "İnsanın Anlam Arayışı" + 2 alıntı
- [x] Araç: `scripts/extract-frames.cjs` (videodan kare çıkarma; `%TEMP%/bateo-frames/`)
- [x] Araç: `scripts/shot.cjs` (kurulum yapıp ekran görüntüsü alır; görsel doğrulama)

#### v3.1 tur 2 — Yayın kalitesi (TAMAM)
- [x] **Yıldızlar dolduruldu**: `Icon` bileşenine `fill` desteği; puan kadar yıldızın içi dolu (4/5 → 4 dolu)
- [x] **Tüm versiyon etiketleri kaldırıldı** (sidebar `v3.0`, ayarlar `v3.0`, README "Sürüm" satırı, yorumlardaki vX etiketleri)
- [x] **Demo tohumlama (seed) kaldırıldı** → uygulama **boş** başlar (`src/db/seed.ts` silindi)
- [x] **Psikoloji tabloları tamamen düşürüldü** (Dexie **v6**: concepts/papers/caseNotes/scaleEntries kaldırıldı)
- [x] `app.setName("BATEO")` → kendi veri klasörü (`%APPDATA%\BATEO`)
- [x] package.json sürümü **1.0.0** (yayın sürümü)
- [x] Yerel veri **sıfırlandı** (`%APPDATA%\BATEO` + eski `%APPDATA%\Electron` silindi)
- [x] Kapsamlı test: 9 rota hatasız, editör/outbox/hatırlatıcı/bulut/senkron yeşil, 0 lint hatası
- NOT: `smoke-editor` artık tohumlamaya bağlı değil (`#/notlar?new=1` ile kendi notunu açar)

#### v3.1 tur 3 — "Tüm verileri sil" düzeltmesi (TAMAM)
- [x] Hata: silme yalnızca eski tabloları boşaltıyordu (kitap/deste/kart/alıntı hariç) ve `.clear()` buluta
      silme bildirmediği için veriler senkronda **geri geliyordu**.
- [x] `src/db/maintenance.ts` → `wipeAllData()`: **12 veri tablosunu** boşaltır + outbox'ı temizler +
      giriş yapılmışsa **buluttaki kayıtları da siler** (`records.delete()`) + çekme imlecini sıfırlar.
- [x] Ayarlar onay metni güncellendi; sonuç mesajı yerel/bulut ayrımını gösterir.
- [x] Test: `npm run test:wipe` → notlar/desteler/kartlar/kitaplar/alıntılar/outbox hepsi 0 (EXIT 0)

#### v3.1 tur 4 — Hesap zorunlu + tanıtım kapısı (TAMAM)
- [x] **Misafir modu kaldırıldı**: bulut yapılandırılmışsa **oturum yoksa uygulama açılmaz**
- [x] `components/auth/WelcomeGate.tsx`: **5 slaytlı tanıtım** (otomatik geçiş + Atla/İleri + nokta göstergesi,
      gradient ikonlar, özellik çipleri) → ardından **kayıt/giriş** formu (marka logosu, gizlilik notu, TR hatalar)
- [x] `App.tsx`: oturum kontrolü → `PageLoader` / `WelcomeGate` / uygulama
- [x] Profil kurulumu (isim + hedefler) **2 adıma** indirildi; tanıtım artık kapıda
- [x] **Çıkışta yerel kopya temizlenir** (`clearLocalData`) → aynı cihazda başka hesap eski veriyi görmez
- [x] `signUp` e-posta doğrulaması gerekip gerekmediğini döndürür (kapıda bilgilendirme)
- [x] Testler yeni akışa uyarlandı: `scripts/lib/session.cjs` (arayüz testleri için oturum enjekte eder),
      yeni `smoke:gate`, güncellenen tüm smoke/test betikleri
- NOT: `.env` yoksa (bulut yapılandırılmamışsa) kapı atlanır, uygulama yerel modda açılır
- NOT: Doğrulama (hepsi EXIT 0) — smoke:gate, 9 rota, smoke:editor, smoke:sync, test:reminders, test:wipe,
      test:app:sync, test:cloud; tip/build temiz; 0 lint hatası

#### v3.2 — Web uygulaması / PWA kurulumu (TAMAM)
- [x] **`vite-plugin-pwa` 2.0** — yalnızca `BATEO_TARGET=web` iken etkin (Electron derlemesi PWA'sız kalır)
- [x] **PWA ikonları**: `npm run pwa:icons` → `public/pwa-192.png`, `pwa-512.png`, `maskable-512.png`
      (Electron ile SVG→PNG; maskable tam taşan gradyan + %70 ölçekli içerik — güvenli alan)
- [x] `manifest.webmanifest` artık **otomatik üretiliyor** (public'teki elle yazılan kaldırıldı; index.html'den link çıkarıldı)
- [x] **Service worker (workbox)**: precache + `autoUpdate` + `navigateFallback` → **kurulabilir ve çevrimdışı**
- [x] Script'ler: `web:build`, `web` (build + sun + tarayıcı aç), `web:serve`, `pwa:icons`
- [x] Test: `npm run test:web` → HTTP 200, render, **SW kaydı**, manifest bağlı (EXIT 0)
- NOT: Web verisi tarayıcının IndexedDB'sinde (**http://localhost:4173** kökeni) — Electron verisinden ayrıdır
- NOT: Kurulumdan sonra SW önbelleği sayesinde sunucu kapalıyken de açılır (oturum önbellekteyse)

#### v3.3 — Android APK araç zinciri (kuruldu)
- [x] **JDK 21 (Temurin)** → `%LOCALAPPDATA%\bateo-dev\jdk` (zip ile, yönetici izni gerekmez)
- [x] **Android cmdline-tools** (`13114758`) → `%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest`
- [x] SDK paketleri kuruldu: `platform-tools`, `platforms;android-36`, `build-tools;36.0.0` (lisanslar kabul edildi)
- [x] `android/local.properties` (`sdk.dir`) — gitignored
- [x] `scripts/build-apk.ps1` + `npm run android:apk` — JAVA_HOME/ANDROID_HOME'u otomatik bulur
- Proje ayarları: AGP **8.13.0**, Gradle **8.14.3**, compileSdk **36**, minSdk **24**
- NOT: Android Studio gerekmedi — komut satırı araçlarıyla derleniyor
- [x] **İlk APK derlendi**: `android/app/build/outputs/apk/debug/app-debug.apk` (**6.9 MB**), masaüstüne kopyalandı
      (`C:\Users\ogurl\OneDrive\Desktop\BATEO.apk`) · Gradle: BUILD SUCCESSFUL (14 dk)
- NOT: Kurulum → telefon USB + USB hata ayıklama açık → `adb install -r BATEO.apk`
      veya APK'yı telefona kopyalayıp "bilinmeyen kaynaklardan yüklemeye izin ver" ile kur
- NOT: Play Store için imzalı `assembleRelease` + keystore gerekir (şimdilik debug APK yeterli)

#### v3.4 — Veritabanı kontrolü & şema temizliği (TAMAM)
- [x] Teşhis araçları: `npm run diagnose` (test profili) ve `npm run diagnose:real` (gerçek profil, okuma odaklı)
- **Bulgu 1:** Veritabanı **sağlamdı** — şema v6 (IndexedDB v60), tablolar tam, hata yok. Yerel veri yalnızca
  testlerin bıraktığı 2 boş nottu (kullanıcı içeriği değil).
- **Bulgu 2 (önemli):** Testler gerçek uygulamayla **aynı profili** kullanıyordu (`%APPDATA%\Electron`) →
  `test:wipe` gibi testler kullanıcı verisini silebilirdi. Düzeltme: `scripts/lib/session.cjs` artık `userData`'yı
  `%TEMP%\bateo-test-profile`'a taşıyor (setPath öncesi klasör oluşturuluyor; yoksa Electron hata veriyordu).
- **Bulgu 3:** **Dexie, şemadan çıkarılan tabloları silmiyor** — geçmiş sürüm tanımlarından devralıyor.
  Bu yüzden eski psikoloji tabloları boş kalıyordu. Düzeltme: bu tanımlar **v4 ve v5 şemalarından da** kaldırıldı
  → yeni profillerde **tam 15 tablo**.
- [x] Gerçek profil sıfırlandı → 15 tablo, 0 kalıntı, 0 kayıt
- [x] Doğrulama: tip/build/lint temiz; `smoke:gate`, `test:app:sync`, `test:wipe` EXIT 0
- NOT: Paketlenmemiş Electron `%APPDATA%\Electron` kullanıyor (paketlenmiş `.exe`'de productName → BATEO)

#### v3.5 — Supabase şeması idempotent + doğrulama
- [x] `schema.sql` son satırı (`alter publication ... add table`) zaten ekliyse hata veriyordu
      (**ERROR 42710: relation "records" is already member of publication**).
      `do $$ ... if not exists (pg_publication_tables) ... end $$;` ile **idempotent** yapıldı.
- [x] `supabase/verify.sql` eklendi — salt okunur doğrulama sorgusu (tablo · politikalar · RLS · fonksiyon · yayın · satır sayısı)
- NOT: Bu hata zararsızdı; scriptin geri kalanı başarıyla uygulanmıştı. `test:cloud` EXIT 0 (şema sağlıklı).

#### v3.6 — Profil modalı flash'ı + dev sunucu reload döngüsü (TAMAM)
- **Belirti (videodan):** onboarded olmasına rağmen "Sana nasıl hitap edelim?" modalı sürekli görünüp kayboluyordu.
- **Sebep 1:** `useSettings()` yüklenene kadar `DEFAULT_SETTINGS` (onboarded=false) döndürüyordu → her açılışta bir an modal görünüyordu.
  Düzeltme: `Onboarding` artık kendi canlı sorgusunu kullanıyor → **ayar satırı yüklenene kadar hiç göstermiyor**.
- **Sebep 2:** Vite, `android/` (Gradle) ve `dist/` yazımlarını görüp sayfayı **sürekli yeniliyordu**.
  Düzeltme: `server.watch.ignored` → `android`, `dist`, `release`, `.git`.
- [x] Modal ayrıca **kapatılabilir** oldu ("Şimdi değil" + dışına tıklama/Esc → onboarded=true)
- [x] Test: `npm run test:onboarding` → 4/4 (onboarded'da gizli · değilken görünür · atlanabilir) EXIT 0
- [x] APK yeniden derlendi (düzeltme dahil) ve masaüstüne kopyalandı
- NOT: `npm run dev` çalışıyorsa **yeniden başlatılmalı** (vite.config değişikliği için)

#### v3.7 — Tema sistemi + sözler + ders mesajı (TAMAM)
- [x] **Günün sözü: 60 alıntı** (filozof, yazar, bilim insanı, psikolog) — güne göre sabit, **60 günde bir döner**;
      yazar adı da gösteriliyor (`src/lib/quotes.ts`)
- [x] **"Bugünün dersleri"**: boş günde **7 dönüşümlü mesaj** + hafta sonu ayrı mesaj; ders varsa özet satırı (toplam/saat aralığı)
- [x] **Tema sistemi** (`src/lib/themes.ts`) — **12 tema, 3 aile**:
      Renk (Gece, Aydınlık, Okyanus, Orman, Gül Kurusu) · Yazı stilli (Sepya, Daktilo, Kağıt) ·
      Sinematik (Uzay, Kum Fırtınası, Kuzey Işıkları, Neon Şehir, Yağmurlu Pencere, Gün Batımı)
- [x] Temalar palet + **yazı tipi** (serif/mono/sans) + **arka plan** (gradyan ve/veya görsel) değiştirir
- [x] `useSettings` tema değişkenlerini uygular; kullanıcı vurgu rengi seçerse **override** eder ("Temanın rengi" ile geri alınır)
- [x] `.theme-wallpaper` katmanı (AppLayout, `z-0`) + içerik `z-10`; yumuşak geçiş
- [x] Ayarlar → **Temalar galerisi** (canlı önizlemeli kartlar) + ayrı "Vurgu rengi" kartı
- [x] `public/themes/README.txt` — görsel adları (uzay/kum/kuzey/neon/yagmur/gunbatimi), boyut (1920×1080 JPG), prompt örnekleri
- [x] Görsel yoksa temanın **gradyan yedeği** çalışır → görseller sonradan eklenebilir
- [x] APK yeniden derlendi (tema sistemi dahil)
- NOT: Doğrulama — tip/build/lint temiz; galeri + sinematik tema ekran görüntüsüyle doğrulandı

#### v3.8 — Temaya göre otomatik koyu/açık + sadeleştirme (TAMAM)
- [x] **Koyu/açık artık temaya göre OTOMATİK** (`themeIsDark`); uyuşmazlık varsa `useSettings` bir kez düzeltir (döngüsüz)
- [x] **"Vurgu rengi" bölümü kaldırıldı**; vurgu her zaman temadan gelir (`useSettings` accent override kaldırıldı)
- [x] Elle **tema düğmeleri kaldırıldı** (Sidebar + TopBar) — artık gereksiz/yanıltıcıydı
- [x] `html` arka planı **opak taban** (`--bg-solid`) → tarayıcıda boşluk/şerit görünmez
- [x] Ghost buton kontrastı iyileştirildi (`text-content`)
- [x] **Teşhis:** tema değişkenleri doğru uygulanıyor; erken "soluk görünüm" **gizli pencerede CSS geçişlerinin donması** yüzündendi
      (geçiş kapatılınca renk `#b5651d` = doğru). Araç: `scripts/probe-theme.cjs`
- [x] APK yeniden derlendi
- NOT: Doğrulama — tip/build/lint temiz; `smoke:gate`, `test:onboarding` (4/4), `test:app:sync` EXIT 0

#### v3.9 — Tema "sonradan gelme" flash'ı kökten çözüldü (TAMAM)
**Belirti:** Tema ilk açılışta bir an varsayılan renkte görünüp sonra gerçek temaya geçiyordu;
arka plan gradyanı ve kartlar milisaniyelik gecikmeyle "gelip gidiyordu".
**Sebep ve çözüm:**
1. Tema, ayarlar IndexedDB'den okunana kadar **sonradan** uygulanıyordu
   → `THEME_CACHE_KEY` ("bateo:theme") ile **localStorage'a ön-bellek**; `index.html` içindeki küçük
     betik değişkenleri **ilk boyamadan önce** uyguluyor. `useSettings` her değişimde önbelleği günceller.
2. `.theme-wallpaper` katmanındaki **400 ms opaklık geçişi** gradyanı geç getiriyordu → geçiş kaldırıldı.
3. Sayfa geçişi (`AppLayout`) ve **Ana Sayfa kart giriş animasyonları** (hero + StatCard stagger)
   "gelip gitme" hissi veriyordu → **animasyonlar kaldırıldı** (içerik anında görünür).
4. Tüm tema değişkenleri tek kaynaktan üretiliyor: `themeCssVars(theme)` (canlı + önbellek aynı kaynak).
- [x] Araç: `scripts/probe-theme.cjs` (canlı değişkenleri + önbelleği doğrular)
- NOT: Doğrulama — neon temasında önbellek `#ff5ec4`, koyu mod, arka plan 1; canlı değerlerle birebir
- [x] APK yeniden derlendi

#### v2.0-a — Senkron altyapısı (TAMAM)
- [x] `types`: Folder/Course/ClassSlot/FocusSession/Exam → `updatedAt?`; yeni `OutboxEntry`, `Meta`
- [x] `db.ts` **v2 şeması**: `outbox` (+seq), `meta` tabloları; tüm senkron tablolara `updatedAt` indeksi
- [x] **Dexie hooks**: creating→updatedAt+enqueue, updating→updatedAt+enqueue, deleting→enqueue(delete)
- [x] `setRemoteApplying()` → uzaktan gelen yazmalar kuyruğa girmez; `flushOutbox()`
- [x] `getMeta/setMeta/getDeviceId()` (cihaz kimliği kalıcı)
- [x] `src/db/sync.ts`: `hasCloud()`, `getSyncStatus()`, `applyRemote()`, `runSync()` (yerel iskelet)
- [x] Ayarlar → **senkron durum kartı**: bekleyen değişiklik, son senkron, cihaz + "Şimdi senkronize et"
- [x] `.env.example` (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) + .gitignore
- [x] Test: `npm run smoke:sync` → IndexedDB outbox sayısı (EXIT 0 = çalışıyor)

#### v2.0-b — Supabase (DEVAM EDİYOR)
- [x] `@supabase/supabase-js` kuruldu; `src/db/supabase.ts` (istemci + TR hata mesajları)
- [x] `supabase/schema.sql`: `records` tablosu (user_id, table_name, doc_id, data jsonb, updated_at, deleted)
      + RLS politikaları + `push_records` RPC (son yazan kazanır) + realtime yayını
- [x] `src/hooks/useAuth.ts` (oturum izleme + signUp/signIn/signOut)
- [x] `src/store/sync.ts` (senkron durumu), `src/modules/settings/AccountCard.tsx` (giriş/kayıt/hesap paneli)
- [x] `sync.ts` gerçek motor: `pushOutbox()` (RPC), `pullChanges()` (updated_at imleci), `runSync()`,
      `startAutoSync()` (açılış + odak + 20 sn tick + gerçek zamanlı), `subscribeRealtime()`
- [x] `.env` (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) — kullanıcı oluşturdu
- [x] CSP düzeltmesi: `connect-src` → `https://*.supabase.co wss://*.supabase.co`
- [x] `getSyncStatus` salt-okunur yapıldı (liveQuery ReadOnlyError önlendi) + `ensureDeviceId`
- [x] Testler: `smoke:cloud` (giriş formu görünüyor), `test:cloud` (Node'dan uçtan uca), `test:app:sync` (uygulamadan gerçek girişle uçtan uca senkron)
- [x] **Uçtan uca senkron ÇALIŞIYOR**: gerçek giriş → not buluta itildi (cloudRows:1) → çekildi
- NOT (kritik): **Dexie `db.outbox.orderBy("seq")` boş dönüyordu** (auto-increment PK indeksi beklenmedik davrandı).
  Çözüm: `db.outbox.limit(N).toArray()` + bellekte `seq`'e göre sırala. (Oku kayıtları: pushOutbox)
- NOT (test): Electron userData'da localStorage kalıcı; testler başında `localStorage.clear()`. Testler her koşuda
  Supabase'de bir test hesabı bırakır — panelden **Authentication → Users** üzerinden `bateo-test*` / `bateo-app*` silinebilir.
- NOT (CSP): `connect-src` → `https://*.supabase.co wss://*.supabase.co` (yoksa realtime/istekler engellenir)
- NOT: `getSyncStatus` salt-okunur; cihaz kimliği `ensureDeviceId()` ile açılışta oluşturulur

#### v2.0-c — Android (Capacitor) — DEVAM EDİYOR
- [x] `@capacitor/core|cli|android|app|splash-screen|status-bar` (v8.5.3)
- [x] `capacitor.config.ts` (appId com.bateo.app, webDir dist, androidScheme https, splash/status bar ayarları)
- [x] `src/lib/native.ts`: durum çubuğu, açılış ekranı gizleme, **Android geri tuşu**; temayla durum çubuğu senkronu
- [x] `App.tsx` → `initNative()`
- [x] **İkon/splash üretimi**: `npm run assets` (Electron ile SVG→PNG, ek bağımlılık yok) → `assets/icon.png` (1024), `splash.png`, `splash-dark.png`
- [x] `npx capacitor-assets generate --android` → 100 kaynak (mipmap ikonlar + tüm splash yoğunlukları)
- [x] `npx cap add android` + `cap sync` çalışıyor
- [x] Scriptler: `assets`, `cap:sync`, `cap:open`, `cap:run`, `android:apk`
- [ ] **Kullanıcı Android Studio + JDK kuracak** → sonra emülatör/cihazda APK
- NOT (tuZAK): `scripts/gen-assets.cjs` — pencere kapatılınca Electron varsayılan olarak uygulamayı kapatıyor;
  `app.on("window-all-closed", ()=>{})` ile engellendi. Ayrıca pencere ekran boyutuna kırpılıyor → splash 1000px üretiliyor.
- NOT: Android derleme `android/local.properties` (sdk.dir) gerektirir; Android Studio otomatik oluşturur.

## Komutlar

```powershell
npm.cmd run dev            # tarayıcı
npm.cmd run electron:dev   # masaüstü pencere
npm.cmd run build          # tsc + vite build
npm.cmd run smoke          # açılış duman testi (EXIT 0 = sağlıklı)
npm.cmd run lint           # oxlint
npm.cmd run electron:build # Windows .exe (release/)
```

## Bilinen Küçük Uyarılar
- oxlint: `Date.now()` render içinde (zararsız), `only-export-components` (icons).
- Electron CSP uyarısı: paketlenmişte kaybolur (CSP başlığı eklendi).

## Hesap & Giriş iyileştirmeleri (v3.10)- **`PasswordInput`**: tüm şifre alanlarında sağda 👁 göster/gizle (yeni `eye-off` ikonu)
- **"Şifremi unuttum"**: kapıda görünür → `resetPasswordForEmail` ile sıfırlama bağlantısı
- **E-posta doğrulama ekranı**: kayıt sonrası onay gerekiyorsa gösterilir + "Tekrar gönder" (`resend`)
- **Kurtarma akışı**: `detectSessionInUrl: true` + `isRecoveryFlow()` → sıfırlama linkiyle gelinince
  `SetNewPassword` ekranı
- **Hesap detayları** (Ayarlar): Şifre değiştir + E-posta değiştir (`updateUser`)
- NOT: Supabase → Authentication → **URL Configuration → Site URL**'i web adresine ayarla
  (aksi hâlde sıfırlama/onay bağlantıları uygulamaya dönmez)

## KRİTİK: Görünmez içerik / "soluk tema" hatası (v3.11)
**Belirti (kullanıcı videosu):** Temalarda içerik kartları neredeyse görünmez, yazılar okunmuyordu.
**Kök neden:** Giriş animasyonları `opacity: 0`'dan başlıyordu ve `animation-fill-mode: both`
yüzünden **animasyon çalışmazsa öğe sonsuza dek `opacity: 0`** kalıyordu.
Ölçüm: `EmptyState` öğesi `opacity: "0"` (görünmez), `--content` doğruydu (`#f7ecdd`).
**Çözüm:**
1. `--animate-fade-in/fade-up/pop`: `both` → **`forwards`** (animasyon başlamazsa öğe normal stilinde = görünür kalır)
2. İçerik bileşenlerinden opacity animasyonu **kaldırıldı**: `EmptyState`, `PageLoader`, `Focus` toast
3. Radix `data-[state=open]:animate-pop` kullanımları korundu (yalnızca açılırken çalışır)
**Doğrulama:** `scripts/probe-theme.cjs <tema> <hash>` → `opacity: 1` ✓; Kum Fırtınası temasında
tüm paneller + boş durum kartı görünür (ekran görüntüsüyle doğrulandı).
**Ders:** İçerik animasyonlarında `fill-mode: both` kullanma; asla "varsayılan olarak görünmez" bırakma.

### v3.11 tur 2 — Kalan animasyon kaynakları da temizlendi
- Kullanıcı: sorun **Ana Sayfa, Odak, İstatistik, Ayarlar** sayfalarında (hepsinde) → ortak nokta:
  **ilerleme çubukları/halkaları + grafik animasyonları**
- [x] `Progress` / `ProgressRing`: genişlik ve `stroke-dashoffset` geçişleri **kaldırıldı** (anında çizilir)
- [x] Stats ilerleme çubukları: `transition-[width] duration-700` kaldırıldı
- [x] Recharts: `isAnimationActive={false}` (Alan + Sütun grafikleri) → animasyon kaynaklı bozulma yok
- [x] **PWA otomatik güncelleme**: `skipWaiting` + `clientsClaim` + `controllerchange` → yeni sürüm gelince
      sayfa otomatik yenilenir (eski önbellek gösterilmez)
- NOT (kullanıcı tarafı): hâlâ eski görünüm olabilir → **tarayıcı önbelleği / PWA service worker / eski APK**.
  Çözüm: Ctrl+Shift+R · DevTools → Application → Service Workers → Unregister + Clear storage · APK'yı yeniden kur
- NOT: `dist` son derlemede **normal (PWA'sız)** bırakılır (Electron testleri için); PWA için `npm run web`


