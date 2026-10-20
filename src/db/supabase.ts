import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function isCloudConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

/** Şifre sıfırlama bağlantısı mı? (uygulama açılmadan önce bir kez belirlenir) */
const RECOVERY_FLOW =
  typeof window !== "undefined" && /(^|[#&?])type=recovery/.test(window.location.href);

export function isRecoveryFlow(): boolean {
  return RECOVERY_FLOW;
}

/** Supabase istemcisini (tekil) döndürür. Yapılandırılmamışsa null. */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anon) return null;
  client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

/** Supabase hata mesajlarını Türkçeleştirir */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("username and password not accepted") || m.includes("badcredentials")) {
    return "Google Workspace SMTP girişini kabul etmedi. noreply hesabına ait 16 haneli Uygulama Şifresi'ni Supabase SMTP ayarlarında parola olarak kaydet.";
  }
  if (m.includes("error sending confirmation email") || m.includes("error sending email")) {
    return "Onay e-postası gönderilemedi. Supabase SMTP ayarlarını ve Google Workspace uygulama şifresini kontrol et.";
  }
  if (m.includes("invalid login credentials")) return "E-posta veya şifre hatalı.";
  if (m.includes("email not confirmed")) return "E-posta henüz doğrulanmadı.";
  if (m.includes("token has expired") || m.includes("otp_expired")) return "Kodun süresi dolmuş. Yeni bir doğrulama e-postası iste.";
  if (m.includes("invalid otp") || m.includes("invalid token")) return "Doğrulama kodu hatalı veya geçersiz.";
  if (m.includes("user already registered")) return "Bu e-posta zaten kayıtlı.";
  if (m.includes("password should be at least")) return "Şifre çok kısa (en az 6 karakter).";
  if (m.includes("unable to validate email")) return "Geçerli bir e-posta gir.";
  if (m.includes("rate limit")) return "Çok fazla deneme yapıldı, biraz bekle.";
  if (m.includes("network")) return "İnternet bağlantısı yok.";
  return message;
}
