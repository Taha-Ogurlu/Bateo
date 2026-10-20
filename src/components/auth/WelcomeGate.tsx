import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { signIn, signUp, sendPasswordReset, resendConfirmation, verifySignupCode } from "../../hooks/useAuth";
import { runSync } from "../../db/sync";
import { Button } from "../ui/Button";
import { PasswordInput } from "../ui/PasswordInput";
import { Icon } from "../icons";
import { BateoLogo } from "../brand/Bateo";
import { cn } from "../../lib/cn";

interface Slide {
  icon: string;
  title: string;
  text: string;
  points: { icon: string; label: string }[];
}

const SLIDES: Slide[] = [
  {
    icon: "dashboard",
    title: "Her şey tek yerde",
    text: "Notlar, görevler, ders programı ve sınavların tek bir merkezde — dağınıklık yok.",
    points: [
      { icon: "note", label: "Zengin notlar" },
      { icon: "list-todo", label: "Görevler & takvim" },
      { icon: "timetable", label: "Ders programı" },
    ],
  },
  {
    icon: "pomodoro",
    title: "Odaklan ve ilerlemeni gör",
    text: "Pomodoro ile çalış, seanslarını kaydet. Haftalık grafikler ve ısı haritası emeğini gösterir.",
    points: [
      { icon: "stopwatch", label: "Odak zamanlayıcı" },
      { icon: "bar-chart", label: "İstatistikler" },
      { icon: "target", label: "Günlük hedefler" },
    ],
  },
  {
    icon: "bookmark",
    title: "Akıllı tekrarla sınava hazırlan",
    text: "Soru-cevap kartları oluştur; sistem aralıklı tekrar ile ne zaman çalışacağını sana söyler.",
    points: [
      { icon: "bookmark", label: "Sınav kartları" },
      { icon: "repeat", label: "Aralıklı tekrar (SM-2)" },
      { icon: "bell", label: "Hatırlatıcılar" },
    ],
  },
  {
    icon: "book",
    title: "Kitaplarını da işle",
    text: "Okuma listeni tut, beğendiğin sözleri kaydet, kitabı bitirince düşüncelerini yaz.",
    points: [
      { icon: "book", label: "Okuma listesi" },
      { icon: "highlight", label: "Alıntılar" },
      { icon: "edit", label: "Kitap sonu düşüncesi" },
    ],
  },
  {
    icon: "sync",
    title: "Hesabınla her cihazda",
    text: "PC ve telefon otomatik senkronize olur. Verilerin yalnızca sana görünür ve çevrimdışı da çalışır.",
    points: [
      { icon: "phone", label: "Telefon + PC" },
      { icon: "lock", label: "Yalnızca sana özel" },
      { icon: "download", label: "Yedekleme" },
    ],
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function WelcomeGate() {
  const [phase, setPhase] = useState<"intro" | "auth">("intro");
  const [slide, setSlide] = useState(0);
  const [auto, setAuto] = useState(true);

  const [mode, setMode] = useState<"up" | "in" | "reset">("up");
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Otomatik geçiş (yalnızca tanıtımda, kullanıcı karışmadıysa)
  useEffect(() => {
    if (phase !== "intro" || !auto) return;
    if (slide >= SLIDES.length - 1) return;
    const t = window.setTimeout(() => setSlide((s) => Math.min(s + 1, SLIDES.length - 1)), 6500);
    return () => window.clearTimeout(t);
  }, [phase, auto, slide]);

  const go = (n: number) => {
    setAuto(false);
    setSlide(Math.max(0, Math.min(SLIDES.length - 1, n)));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "reset") {
        await sendPasswordReset(email);
        setInfo("Sıfırlama bağlantısı e-postana gönderildi. Gelen kutunu (ve spam klasörünü) kontrol et.");
        return;
      }
      if (mode === "in") {
        await signIn(email.trim(), password);
      } else {
        const r = await signUp(email.trim(), password);
        if (r.alreadyRegistered) {
          setMode("in");
          setErr("Bu e-posta ile açılmış bir hesap var. Giriş yapabilir veya ‘Şifremi unuttum’ ile yeni şifre belirleyebilirsin.");
          return;
        }
        if (r.needsConfirmation) {
          setPassword("");
          setOtp("");
          setVerifyEmail(email.trim());
          setInfo(null);
          return;
        }
      }
      setPassword("");
      void runSync();
    } catch (e2) {
      const message = (e2 as Error).message;
      if (message.toLocaleLowerCase("tr-TR").includes("zaten kayıtlı")) {
        setMode("in");
        setErr("Bu e-posta ile açılmış bir hesap var. Giriş yapabilir veya ‘Şifremi unuttum’ ile yeni şifre belirleyebilirsin.");
      } else {
        setErr(message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden bg-bg px-4 py-8">
      {/* Arka plan ışıkları */}
      <div className="pointer-events-none absolute -top-40 -left-24 h-[26rem] w-[26rem] rounded-full accent-gradient opacity-[0.18] blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-48 -right-24 h-[28rem] w-[28rem] rounded-full bg-accent2 opacity-[0.14] blur-[100px]" />

      <div className={`relative w-full ${phase === "auth" ? "max-w-5xl" : "max-w-xl"}`}>
        <div className="mb-6 flex justify-center">
          <BateoLogo height={44} className="text-content" />
        </div>

        <div className="overflow-hidden rounded-3xl border border-line bg-surface/80 shadow-[var(--shadow)] backdrop-blur-xl">
          <AnimatePresence mode="wait" initial={false}>
            {phase === "intro" ? (
              <motion.div
                key="intro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="flex flex-col"
              >
                <div className="relative min-h-[310px] px-7 pt-8 sm:px-9">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={slide}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.26, ease: EASE }}
                    >
                      <div className="relative mb-5 grid h-20 w-20 place-items-center">
                        <span className="absolute inset-0 rounded-3xl accent-gradient opacity-25 blur-xl" />
                        <span className="relative grid h-20 w-20 place-items-center rounded-3xl accent-gradient text-[var(--accent-fg)]">
                          <Icon name={SLIDES[slide].icon} size={38} strokeWidth={1.6} />
                        </span>
                      </div>

                      <h1 className="text-2xl font-bold tracking-tight text-content">{SLIDES[slide].title}</h1>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{SLIDES[slide].text}</p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {SLIDES[slide].points.map((p) => (
                          <span
                            key={p.label}
                            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg2/50 px-3 py-1.5 text-[12px] font-medium text-content"
                          >
                            <Icon name={p.icon} size={14} className="text-accent" />
                            {p.label}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-3 border-t border-line px-7 py-4 sm:px-9">
                  <div className="flex items-center gap-1.5">
                    {SLIDES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => go(i)}
                        aria-label={`${i + 1}. tanıtım`}
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: i === slide ? 22 : 8,
                          background: i === slide ? "var(--accent)" : "var(--line)",
                        }}
                      />
                    ))}
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    {slide > 0 && (
                      <Button variant="ghost" onClick={() => go(slide - 1)}>
                        Geri
                      </Button>
                    )}
                    {slide < SLIDES.length - 1 ? (
                      <>
                        <Button variant="ghost" onClick={() => setPhase("auth")}>
                          Atla
                        </Button>
                        <Button onClick={() => go(slide + 1)} className="gap-2">
                          İleri <Icon name="chevron-right" size={16} />
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setPhase("auth")} className="gap-2">
                        <Icon name="check" size={16} /> Başlayalım
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="auth"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]"
              >
                <aside className="relative hidden min-h-full flex-col justify-between overflow-hidden border-r border-line bg-gradient-to-br from-accent/15 via-bg2/45 to-accent2/10 p-8 md:flex lg:p-10">
                  <div aria-hidden className="pointer-events-none absolute -right-24 top-12 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
                  <div className="relative">
                    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
                      <Icon name="sparkles" size={14} /> BATEO çalışma alanı
                    </span>
                    <h1 className="mt-7 max-w-sm text-3xl font-bold leading-tight tracking-tight text-content lg:text-4xl">
                      Küçük adımlar, <span className="text-accent">büyük ilerleme.</span>
                    </h1>
                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
                      Derslerini planla, notlarını biriktir ve odağını koru. Her şeyin tek, sana ait bir çalışma alanında.
                    </p>
                  </div>
                  <div className="relative mt-10 rounded-2xl border border-line bg-surface/75 p-4 shadow-[var(--shadow)] backdrop-blur">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-accentsoft text-accent"><Icon name="focus" size={20} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted">Bugünün odağı</p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-content">Kendi ritmini oluştur</p>
                      </div>
                      <span className="text-xs font-semibold text-accent">25 dk</span>
                    </div>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full w-2/3 rounded-full accent-gradient" /></div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        { icon: "note", label: "Notlar" },
                        { icon: "list-todo", label: "Görevler" },
                        { icon: "bar-chart", label: "İlerleme" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-center gap-1.5 rounded-lg bg-bg2/60 px-2 py-2 text-[11px] font-medium text-muted">
                          <Icon name={item.icon} size={14} className="text-accent" /> {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>

                <div className="px-7 py-8 sm:px-9">
                <button
                  onClick={() => {
                    setPhase("intro");
                    setErr(null);
                    setInfo(null);
                  }}
                  className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-content"
                >
                  <Icon name="chevron-left" size={15} /> Tanıtıma dön
                </button>

                {verifyEmail ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accentsoft text-accent">
                      <Icon name="mail" size={26} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-content">E-postanı doğrula</h1>
                    <p className="text-sm leading-relaxed text-muted">
                      <span className="font-medium text-content">{verifyEmail}</span> adresine gönderdiğimiz doğrulama kodunu gir. E-postada kod yerine bağlantı varsa ona tıklayarak da hesabını doğrulayabilirsin.
                    </p>
                    <form
                      onSubmit={async (event) => {
                        event.preventDefault();
                        setErr(null);
                        setInfo(null);
                        if (otp.replace(/\s/g, "").length !== 6) {
                          setErr("E-postana gelen 6 haneli kodu gir.");
                          return;
                        }
                        setBusy(true);
                        try {
                          await verifySignupCode(verifyEmail, otp);
                          setOtp("");
                          setVerifyEmail(null);
                          setInfo("E-posta doğrulandı. BATEO'ya hoş geldin!");
                          void runSync();
                        } catch (e) {
                          setErr((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                      className="flex flex-col gap-3"
                    >
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[12px] font-medium text-muted">6 haneli doğrulama kodu</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          autoFocus
                          required
                          maxLength={6}
                          pattern="[0-9]{6}"
                          value={otp}
                          onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="000000"
                          aria-label="6 haneli e-posta doğrulama kodu"
                          className="h-14 w-full rounded-xl border border-line bg-bg2/60 px-4 text-center font-mono text-2xl font-semibold tracking-[0.55em] text-content outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)] placeholder:text-muted/40"
                        />
                      </label>
                      <Button type="submit" size="lg" disabled={busy || otp.length !== 6} className="justify-center gap-2">
                        {busy ? "Kod doğrulanıyor…" : "Kodu doğrula"}
                        {!busy && <Icon name="check" size={17} />}
                      </Button>
                    </form>
                    {info && <p className="text-[12px] text-accent">{info}</p>}
                    {err && <p className="text-[12px] text-danger">{err}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Button
                        className="gap-2"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          setErr(null);
                          setInfo(null);
                          try {
                            await resendConfirmation(verifyEmail);
                            setInfo("Yeni doğrulama kodu e-postana gönderildi.");
                          } catch (e) {
                            setErr((e as Error).message);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        <Icon name="repeat" size={16} /> E-postayı tekrar gönder
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setVerifyEmail(null);
                          setOtp("");
                          setMode("in");
                          setInfo(null);
                        }}
                      >
                        Giriş yap
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold tracking-tight text-content">
                      {mode === "up" ? "Hesap oluştur" : mode === "reset" ? "Şifreni sıfırla" : "Tekrar hoş geldin"}
                    </h1>
                    <p className="mt-1.5 text-sm text-muted">
                      {mode === "up"
                        ? "Verilerin hesabına bağlanır; PC ve telefonda senkron kalır."
                        : mode === "reset"
                          ? "E-postanı yaz; sana bir sıfırlama bağlantısı gönderelim."
                          : "Devam etmek için hesabına giriş yap."}
                    </p>

                    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[12px] font-medium text-muted">E-posta</span>
                        <div className="flex h-11 items-center gap-2.5 rounded-xl border border-line bg-bg2/50 px-3.5 focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
                          <Icon name="profile" size={17} className="shrink-0 text-muted" />
                          <input
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ornek@eposta.com"
                            className="flex-1 bg-transparent text-sm text-content outline-none placeholder:text-muted/60"
                          />
                        </div>
                      </label>

                      {mode !== "reset" && (
                        <label className="flex flex-col gap-1.5">
                          <span className="text-[12px] font-medium text-muted">Şifre</span>
                          <PasswordInput
                            autoComplete={mode === "up" ? "new-password" : "current-password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="En az 6 karakter"
                          />
                        </label>
                      )}

                      {err && <p className="text-[12px] text-danger">{err}</p>}
                      {info && <p className="text-[12px] text-accent">{info}</p>}

                      <Button type="submit" size="lg" disabled={busy} className="mt-1 justify-center gap-2">
                        {busy
                          ? "İşleniyor…"
                          : mode === "up"
                            ? "Hesap oluştur"
                            : mode === "reset"
                              ? "Sıfırlama bağlantısı gönder"
                              : "Giriş yap"}
                        {!busy && <Icon name="chevron-right" size={17} />}
                      </Button>
                    </form>

                    <div className="mt-5 flex flex-wrap items-center gap-3 text-[12px]">
                      {mode !== "reset" && (
                        <button
                          onClick={() => {
                            setMode("reset");
                            setErr(null);
                            setInfo(null);
                          }}
                          className="font-medium text-muted transition-colors hover:text-content"
                        >
                          Şifremi unuttum
                        </button>
                      )}
                      <span className="ml-auto text-muted">
                        {mode === "up" ? "Hesabın var mı?" : "Hesabın yok mu?"}
                      </span>
                      <button
                        onClick={() => {
                          setMode(mode === "up" ? "in" : "up");
                          setErr(null);
                          setInfo(null);
                        }}
                        className="font-semibold text-accent transition-opacity hover:opacity-80"
                      >
                        {mode === "up" ? "Giriş yap" : "Hesap oluştur"}
                      </button>
                    </div>
                  </>
                )}

                <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-line bg-bg2/40 p-3">
                  <Icon name="lock" size={15} className="mt-0.5 shrink-0 text-accent" />
                  <p className="text-[11.5px] leading-relaxed text-muted">
                    Verilerin yalnızca sana görünür (satır düzeyi güvenlik). Uygulama çevrimdışı da çalışır;
                    bağlantı gelince otomatik senkronize olur.
                  </p>
                </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className={cn("mt-5 text-center text-[11px] text-muted")}>
          BATEO · öğrenci çalışma merkezi
        </p>
      </div>
    </div>
  );
}
