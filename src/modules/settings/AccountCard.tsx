import { useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getSyncStatus, runSync } from "../../db/sync";
import { changeEmail, changePassword, signIn, signOut, signUp, useAuth } from "../../hooks/useAuth";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { useSync } from "../../store/sync";
import { relative } from "../../lib/date";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/icons";

export function AccountCard({ view = "sync" }: { view?: "sync" | "account" }) {
  const { user, loading, configured } = useAuth();
  const status = useLiveQuery(() => getSyncStatus(), []);
  const syncing = useSync((s) => s.syncing);
  const lastError = useSync((s) => s.lastError);

  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Hesap detayları (şifre / e-posta değiştir)
  const [panel, setPanel] = useState<null | "pw" | "em">(null);
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emBusy, setEmBusy] = useState(false);

  const submitPassword = async () => {
    setErr(null);
    setMsg(null);
    if (newPw.length < 6) return setErr("Şifre en az 6 karakter olmalı.");
    if (newPw !== newPw2) return setErr("Şifreler birbiriyle uyuşmuyor.");
    setPwBusy(true);
    try {
      await changePassword(newPw);
      setMsg("Şifren güncellendi.");
      setNewPw("");
      setNewPw2("");
      setPanel(null);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPwBusy(false);
    }
  };

  const submitEmail = async () => {
    setErr(null);
    setMsg(null);
    if (!newEmail.trim()) return setErr("Yeni e-posta adresini gir.");
    setEmBusy(true);
    try {
      await changeEmail(newEmail);
      setMsg("Onay bağlantısı yeni e-posta adresine gönderildi.");
      setNewEmail("");
      setPanel(null);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setEmBusy(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      if (mode === "in") await signIn(email.trim(), password);
      else await signUp(email.trim(), password);
      setPassword("");
      setMsg(mode === "in" ? "Giriş yapıldı." : "Kayıt oluşturuldu.");
      void runSync();
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  /* Bulut yapılandırılmamış */
  if (!configured) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-line bg-bg2/40 p-3.5">
        <Icon name="info" size={18} className="text-muted mt-0.5 shrink-0" />
        <p className="text-[12px] text-muted leading-relaxed">
          {view === "sync"
            ? "Bulut senkronizasyonu bu uygulamada etkin değil. BATEO yerel modda çalışmaya devam eder."
            : "Henüz bir bulut hesabı bağlı değil. Uygulama tercihlerin bu cihazda saklanıyor; senkronizasyonu Ayarlar bölümünden açabilirsin."}
        </p>
      </div>
    );
  }

  /* Giriş / Kayıt */
  if (!user) {
    return (
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Icon name="lock" size={17} className="text-accent" />
          <p className="text-[13px] font-medium text-content">
            {mode === "in" ? "Hesabına giriş yap" : "Yeni hesap oluştur"}
          </p>
          <span className="ml-auto inline-flex items-center rounded-lg border border-line bg-bg2/60 p-0.5">
            <button
              type="button"
              onClick={() => {
                setMode("in");
                setErr(null);
              }}
              className={`h-7 rounded-md px-2.5 text-[11.5px] font-medium transition-colors ${
                mode === "in" ? "bg-surface text-content shadow-sm" : "text-muted hover:text-content"
              }`}
            >
              Giriş
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("up");
                setErr(null);
              }}
              className={`h-7 rounded-md px-2.5 text-[11.5px] font-medium transition-colors ${
                mode === "up" ? "bg-surface text-content shadow-sm" : "text-muted hover:text-content"
              }`}
            >
              Kayıt
            </button>
          </span>
        </div>

        <Field label="E-posta">
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@eposta.com"
            required
          />
        </Field>
        <Field label="Şifre" hint="En az 6 karakter">
          <PasswordInput
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </Field>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={busy || loading} className="gap-2">
            <Icon name={mode === "in" ? "lock" : "plus"} size={16} />
            {busy ? "İşleniyor…" : mode === "in" ? "Giriş yap" : "Kayıt ol"}
          </Button>
          <span className="text-[11px] text-muted">Verilerin yalnızca sana görünür (RLS).</span>
        </div>

        {err && <p className="text-[12px] text-danger">{err}</p>}
        {msg && <p className="text-[12px] text-accent">{msg}</p>}
      </form>
    );
  }

  /* Giriş yapılmış */
  if (view === "sync") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-accentsoft text-accent">
            <Icon name="profile" size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-content">{user.email}</p>
            <p className="text-[11px] text-muted">Bulut hesabı · {status?.configured ? "Senkron açık" : "Yerel"}</p>
          </div>
          <Badge tone={syncing ? "accent" : "success"} className="ml-auto">
            {syncing ? "Senkronize ediliyor…" : "Bağlı"}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Bekleyen değişiklik" value={status ? String(status.pending) : "…"} />
          <Metric label="Son senkron" value={status?.lastSyncAt ? relative(status.lastSyncAt) : "—"} />
          <Metric label="Cihaz" value={status?.deviceId ? status.deviceId.slice(-6) : "…"} />
        </div>
        <Button onClick={() => void runSync()} disabled={syncing} className="w-fit gap-2">
          <Icon name="sync" size={16} /> {syncing ? "Senkronize ediliyor…" : "Şimdi senkronize et"}
        </Button>
        {lastError && <p className="text-[12px] text-danger">Senkron hatası: {lastError}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-accentsoft text-accent">
          <Icon name="profile" size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-content">{user.email}</p>
          <p className="text-[11px] text-muted">BATEO hesabı</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          disabled={signOutBusy}
          onClick={async () => {
            if (!confirm("Çıkıştan önce bekleyen değişiklikler buluta gönderilecek. Bu cihazdaki yerel kopya temizlenecek. Devam?")) return;
            setErr(null);
            setMsg(null);
            setSignOutBusy(true);
            try {
              await signOut();
            } catch (error) {
              setErr((error as Error).message || "Çıkış tamamlanamadı; yerel veriler korunuyor.");
            } finally {
              setSignOutBusy(false);
            }
          }}
          className="gap-2 text-danger hover:text-danger"
        >
          <Icon name="close" size={16} /> {signOutBusy ? "Senkronize ediliyor…" : "Çıkış yap"}
        </Button>
      </div>

      {/* Hesap detayları */}
      <div className="rounded-xl border border-line bg-bg2/40 p-3.5">
        <p className="mb-3 text-[13px] font-medium text-content">Hesap detayları</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setPanel(panel === "pw" ? null : "pw");
              setMsg(null);
              setErr(null);
            }}
          >
            <Icon name="lock" size={15} /> Şifre değiştir
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setPanel(panel === "em" ? null : "em");
              setMsg(null);
              setErr(null);
            }}
          >
            <Icon name="profile" size={15} /> E-posta değiştir
          </Button>
        </div>

        {panel === "pw" && (
          <div className="mt-3 flex flex-col gap-2.5">
            <PasswordInput
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Yeni şifre"
              autoComplete="new-password"
            />
            <PasswordInput
              value={newPw2}
              onChange={(e) => setNewPw2(e.target.value)}
              placeholder="Yeni şifre (tekrar)"
              autoComplete="new-password"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="gap-1.5" disabled={pwBusy} onClick={submitPassword}>
                <Icon name="check" size={15} /> {pwBusy ? "Kaydediliyor…" : "Şifreyi kaydet"}
              </Button>
              <span className="text-[11px] text-muted">En az 6 karakter.</span>
            </div>
          </div>
        )}

        {panel === "em" && (
          <div className="mt-3 flex flex-col gap-2.5">
            <Input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={user.email ?? "Yeni e-posta"}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="gap-1.5" disabled={emBusy} onClick={submitEmail}>
                <Icon name="check" size={15} /> {emBusy ? "Kaydediliyor…" : "E-postayı kaydet"}
              </Button>
              <span className="text-[11px] text-muted">Onay bağlantısı yeni adresine gönderilir.</span>
            </div>
          </div>
        )}
      </div>

      {(err || msg) && (
        <p className={`text-[12px] ${err ? "text-danger" : "text-accent"}`}>{err ?? msg}</p>
      )}

      {lastError && <p className="text-[12px] text-danger">Senkron hatası: {lastError}</p>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-2.5 py-2 text-center">
      <p className="truncate text-sm font-semibold text-content">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted">{label}</p>
    </div>
  );
}
