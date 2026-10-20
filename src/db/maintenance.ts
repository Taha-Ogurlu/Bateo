import { db, discardPendingOutbox, flushOutbox, setRemoteApplying } from "./db";
import { getSupabase, isCloudConfigured } from "./supabase";
import { runSync, startAutoSync, stopAutoSync } from "./sync";

/** Kullanıcı verisi tutan tüm tablolar (ayarlar ve meta hariç) */
export const DATA_TABLES = [
  "notes",
  "folders",
  "tasks",
  "courses",
  "classSlots",
  "focusSessions",
  "exams",
  "dayEntries",
  "decks",
  "flashcards",
  "books",
  "bookQuotes",
] as const;

/** Yerel veriyi (yalnızca cihazdaki) temizler — buluta dokunmaz. Çıkışta kullanılır. */
export async function clearLocalData(): Promise<void> {
  // A logout must never discard an unpersisted or unsent change.
  await flushOutbox();
  if ((await db.outbox.count()) > 0) {
    throw new Error("Senkronize edilmemiş değişiklikler var. Veriler korunuyor; tekrar senkronize edip çıkış yap.");
  }
  setRemoteApplying(true);
  try {
    await db.transaction(
      "rw",
      DATA_TABLES.map((t) => db.table(t)),
      async () => {
        for (const t of DATA_TABLES) {
          await db.table(t).clear();
        }
      },
    );
    // A cleared local database needs a full pull next time, even if the
    // previous account had advanced its sync cursor.
  await discardPendingOutbox();
    await db.meta.where("key").startsWith("lastSyncCursor").delete();
  } finally {
    setRemoteApplying(false);
  }
}

/**
 * Tüm kullanıcı verisini siler.
 * - Yereldeki tüm veri tablolarını boşaltır
 * - Bekleyen senkron kuyruğunu temizler (silmeleri tek tek göndermeye gerek yok)
 * - Giriş yapılmışsa buluttaki kayıtları da siler (aksi hâlde senkronda geri gelir)
 */
export async function wipeAllData(): Promise<{ cloudCleared: boolean; signedIn: boolean }> {
  // Bulut silme başarısızsa yerel kopyayı koru. Aksi hâlde geçici bir
  // bağlantı hatası kullanıcının tek yedeğini de kaybettirebilir.
  let cloudCleared = false;
  let signedIn = false;
  const sb = getSupabase();
  if (sb && isCloudConfigured()) {
    const { data } = await sb.auth.getSession();
    const uid = data.session?.user.id;
    if (uid) {
      signedIn = true;
      stopAutoSync();
      try {
        // Önce çalışan sync'i tamamla. Ardından silme, başka bir cihazın ya da
        // arka plandaki kuyruğun verileri silme sonrasında yeniden yazmasını önler.
        const sync = await runSync();
        await flushOutbox();
        if (!sync.ok || (await db.outbox.count()) > 0) {
          throw new Error(`Bulut bağlantısı doğrulanamadı; veriler silinmedi. ${sync.message}`);
        }
        const { error } = await sb.from("records").delete().eq("user_id", uid);
        if (error) throw new Error(`Bulut verileri silinemedi; cihazdaki veriler korundu. ${error.message}`);
        cloudCleared = true;
      } catch (error) {
        startAutoSync();
        throw error;
      }
    }
  }

  setRemoteApplying(true);
  try {
    await db.transaction(
      "rw",
      DATA_TABLES.map((t) => db.table(t)),
      async () => {
        for (const t of DATA_TABLES) await db.table(t).clear();
      },
    );
    await discardPendingOutbox();
    await db.meta.where("key").startsWith("lastSyncCursor").delete();
    await db.meta.delete("lastSyncAt");
    await db.meta.delete("lastSyncResult");
  } finally {
    setRemoteApplying(false);
    if (signedIn) startAutoSync();
  }

  return { cloudCleared, signedIn };
}
