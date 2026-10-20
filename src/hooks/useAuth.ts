import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { authErrorMessage, getSupabase } from "../db/supabase";
import { runSync, startAutoSync, stopAutoSync } from "../db/sync";
import { db, flushOutbox } from "../db/db";
import { clearLocalData } from "../db/maintenance";

/** Oturum durumunu izler */
export function useAuth() {
  const sb = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(sb));

  useEffect(() => {
    if (!sb) {
      setLoading(false);
      return;
    }
    let mounted = true;
    void sb.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [sb]);

  return { session, user: session?.user ?? null, loading, configured: Boolean(sb) };
}

function client() {
  const sb = getSupabase();
  if (!sb) throw new Error("Bulut yapılandırılmadı.");
  return sb;
}

/** Kayıt ol. E-posta doğrulaması açıksa oturum oluşmaz. */
export async function signUp(email: string, password: string): Promise<{ needsConfirmation: boolean; alreadyRegistered: boolean }> {
  const { data, error } = await client().auth.signUp({ email, password });
  if (error) throw new Error(authErrorMessage(error.message));
  // Supabase intentionally returns an obfuscated user for an existing account
  // when email confirmation is enabled. An empty identities list identifies it.
  const alreadyRegistered = data.user?.identities?.length === 0;
  return { needsConfirmation: !data.session && !alreadyRegistered, alreadyRegistered };
}

/** Kayıt e-postasına gönderilen tek kullanımlık kodu doğrula. */
export async function verifySignupCode(email: string, token: string): Promise<void> {
  const { error } = await client().auth.verifyOtp({
    email: email.trim(),
    token: token.replace(/\s/g, ""),
    type: "email",
  });
  if (error) throw new Error(authErrorMessage(error.message));
}

/** Giriş yap */
export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await client().auth.signInWithPassword({ email, password });
  if (error) throw new Error(authErrorMessage(error.message));
}

/** Çıkış yap */
export async function signOut(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { data } = await sb.auth.getSession();
  if (data.session) {
    // Do not let logout race the normal 20-second sync timer. If the cloud is
    // unavailable, keep the session and the local copy so the user can retry.
    stopAutoSync();
    try {
      const result = await runSync();
      await flushOutbox();
      const pending = await db.outbox.count();
      if (!result.ok || pending > 0) {
        throw new Error(
          pending > 0
            ? `${pending} değişiklik henüz buluta ulaşmadı. Çıkış yapılmadı; tekrar senkronize edip dene.`
            : `Bulut senkronizasyonu tamamlanmadı. Çıkış yapılmadı; verilerin bu cihazda korundu. ${result.message}`,
        );
      }
      // Stop timers/realtime first, then remove the device copy while the
      // account session is still known. Its cursor is reset for the next login.
      await clearLocalData();
      const { error } = await sb.auth.signOut();
      if (error) throw new Error(authErrorMessage(error.message));
    } catch (error) {
      // If sign-out or local cleanup failed, keep this account usable. In the
      // rare case cleanup completed first, a fresh pull restores its cloud copy.
      startAutoSync();
      void runSync();
      throw error;
    }
    return;
  }
  const { error } = await sb.auth.signOut();
  if (error) throw new Error(authErrorMessage(error.message));
}

/** Şifre sıfırlama bağlantısını e-posta ile gönder */
export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await client().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
  });
  if (error) throw new Error(authErrorMessage(error.message));
}

/** Kayıt onay e-postasını tekrar gönder */
export async function resendConfirmation(email: string): Promise<void> {
  const { error } = await client().auth.resend({ type: "signup", email: email.trim() });
  if (error) throw new Error(authErrorMessage(error.message));
}

/** Şifreyi değiştir (giriş yapılmışken ya da kurtarma akışında) */
export async function changePassword(password: string): Promise<void> {
  const { error } = await client().auth.updateUser({ password });
  if (error) throw new Error(authErrorMessage(error.message));
}

/** E-postayı değiştir (onay bağlantıları gönderilir) */
export async function changeEmail(email: string): Promise<void> {
  const { error } = await client().auth.updateUser({ email: email.trim() });
  if (error) throw new Error(authErrorMessage(error.message));
}
