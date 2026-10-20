import { useState } from "react";
import { changePassword, signOut } from "../../hooks/useAuth";
import { Button } from "../ui/Button";
import { PasswordInput } from "../ui/PasswordInput";
import { BateoLogo } from "../brand/Bateo";
import { Icon } from "../icons";

/**
 * Şifre sıfırlama bağlantısıyla gelindiğinde gösterilir.
 * (E-postadaki bağlantı uygulamayı bir oturumla açar; burada yeni şifre belirlenir.)
 */
export function SetNewPassword({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setErr(null);
    if (pw.length < 6) return setErr("Şifre en az 6 karakter olmalı.");
    if (pw !== pw2) return setErr("Şifreler birbiriyle uyuşmuyor.");
    setBusy(true);
    try {
      await changePassword(pw);
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden bg-bg px-4 py-8">
      <div className="pointer-events-none absolute -top-40 -left-24 h-[26rem] w-[26rem] rounded-full accent-gradient opacity-[0.18] blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-48 -right-24 h-[28rem] w-[28rem] rounded-full bg-accent2 opacity-[0.14] blur-[100px]" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <BateoLogo height={44} className="text-content" />
        </div>

        <div className="rounded-3xl border border-line bg-surface/80 p-7 shadow-[var(--shadow)] backdrop-blur-xl">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accentsoft text-accent">
            <Icon name="lock" size={24} />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-content">Yeni şifre belirle</h1>
          <p className="mt-1.5 text-sm text-muted">Hesabın için yeni bir şifre gir.</p>

          <div className="mt-5 flex flex-col gap-3">
            <PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Yeni şifre" autoComplete="new-password" autoFocus />
            <PasswordInput value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Yeni şifre (tekrar)" autoComplete="new-password" />
          </div>

          {err && <p className="mt-3 text-[12px] text-danger">{err}</p>}

          <Button size="lg" className="mt-5 w-full justify-center gap-2" disabled={busy} onClick={save}>
            <Icon name="check" size={17} /> {busy ? "Kaydediliyor…" : "Şifreyi kaydet"}
          </Button>

          <button
            onClick={async () => {
              await signOut();
              onDone();
            }}
            className="mt-4 w-full text-center text-[12px] text-muted transition-colors hover:text-content"
          >
            Farklı bir hesapla giriş yap
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] text-muted">BATEO · öğrenci çalışma merkezi</p>
      </div>
    </div>
  );
}
