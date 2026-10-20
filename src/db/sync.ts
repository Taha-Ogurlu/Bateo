import type { RealtimeChannel } from "@supabase/supabase-js";
import { db, flushOutbox, readDeviceId, getMeta, setMeta, setRemoteApplying, SYNCED_TABLES } from "./db";
import { getSupabase, isCloudConfigured } from "./supabase";
import { useSync } from "../store/sync";

/**
 * BATEO senkron motoru
 * - push: yerel `outbox` → Supabase `push_records` RPC (son yazan kazanır)
 * - pull: Sunucudaki `records` (updated_at > imleç) → yerel
 * - otomatik: açılış, pencere odaklanınca, periyodik, gerçek zamanlı
 */

const PUSH_BATCH = 200;
// Supabase projects commonly cap REST responses at 1000 rows. Fetch pages
// instead of advancing the cursor after a single capped response.
const PULL_LIMIT = 1000;
const MAX_ROUNDS = 8;

let syncing = false;
let activeSync: Promise<SyncResult> | null = null;
let started = false;
let tickTimer: ReturnType<typeof setInterval> | null = null;
let channel: RealtimeChannel | null = null;

export function hasCloud(): boolean {
  return isCloudConfigured();
}

export function isSyncing(): boolean {
  return syncing;
}

/* ---------------- Durum ---------------- */

export interface SyncStatus {
  deviceId: string;
  pending: number;
  lastSyncAt: number | null;
  configured: boolean;
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const [deviceId, pending, lastSyncAt] = await Promise.all([
    readDeviceId(),
    db.outbox.count(),
    getMeta<number>("lastSyncAt"),
  ]);
  return { deviceId, pending, lastSyncAt: lastSyncAt ?? null, configured: hasCloud() };
}

export async function recordSync(at = Date.now()): Promise<void> {
  await setMeta("lastSyncAt", at);
}

export async function clearOutbox(): Promise<void> {
  await db.outbox.clear();
}

async function userId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.user.id ?? null;
}

/* ---------------- Push ---------------- */

async function pushOutbox(): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;
  await flushOutbox();

  const raw = await db.outbox.limit(PUSH_BATCH).toArray();
  const entries = raw.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  if (entries.length === 0) return 0;

  const payload: {
    table_name: string;
    doc_id: string;
    data: unknown;
    updated_at: number;
    deleted: boolean;
  }[] = [];

  for (const e of entries) {
    if (e.op === "delete") {
      payload.push({ table_name: e.table, doc_id: e.docId, data: null, updated_at: e.at, deleted: true });
    } else {
      const doc = (await db.table(e.table).get(e.docId)) as { updatedAt?: number } | undefined;
      if (!doc) {
        // kayıt artık yok: silme olarak gönder
        payload.push({ table_name: e.table, doc_id: e.docId, data: null, updated_at: e.at, deleted: true });
      } else {
        payload.push({
          table_name: e.table,
          doc_id: e.docId,
          data: doc,
          updated_at: doc.updatedAt ?? e.at,
          deleted: false,
        });
      }
    }
  }

  const { error } = await sb.rpc("push_records", { p_records: payload });
  if (error) throw new Error(error.message);

  await db.outbox.bulkDelete(entries.map((e) => e.seq as number));
  return entries.length;
}

/* ---------------- Pull ---------------- */

async function pullChanges(uid: string): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;

  // A cursor belongs to one account. The old shared cursor could skip a new
  // account's older records, and clearing local data on logout requires a
  // complete pull when the same account signs in again.
  const cursorKey = `lastSyncCursor:${uid}`;
  const cursor = (await getMeta<number>(cursorKey)) ?? 0;
  let offset = 0;
  let count = 0;
  let max = cursor;

  while (true) {
    const { data, error } = await sb
      .from("records")
      .select("table_name,doc_id,data,updated_at,deleted")
      .gt("updated_at", cursor)
      .order("updated_at", { ascending: true })
      .order("table_name", { ascending: true })
      .order("doc_id", { ascending: true })
      .range(offset, offset + PULL_LIMIT - 1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;

    await db.transaction(
      "rw",
      SYNCED_TABLES.map((table) => db.table(table)),
      async () => {
        setRemoteApplying(true);
        try {
          for (const row of data) {
            const t = row.table_name as string;
            if (!(SYNCED_TABLES as readonly string[]).includes(t)) continue;
            if (row.deleted) {
              await db.table(t).delete(row.doc_id);
            } else if (row.data) {
              // The key column is authoritative if an older or malformed
              // payload has a missing/mismatched id inside its JSON body.
              await db.table(t).put({ ...(row.data as Record<string, unknown>), id: row.doc_id });
            }
          }
        } finally {
          setRemoteApplying(false);
        }
      },
    );

    max = data.reduce((m, r) => Math.max(m, Number(r.updated_at) || 0), max);
    count += data.length;
    offset += data.length;
    if (data.length < PULL_LIMIT) break;
  }

  if (count > 0) {
    await setMeta(cursorKey, max);
    // Remove the pre-account-scoped cursor after the first successful pull.
    await db.meta.delete("lastSyncCursor");
  }
  return count;
}

/* ---------------- Uzak kayıt uygulama ---------------- */

export async function applyRemote(
  table: string,
  docId: string,
  op: "put" | "delete",
  row?: Record<string, unknown>,
): Promise<void> {
  if (!(SYNCED_TABLES as readonly string[]).includes(table)) return;
  const t = db.table(table);
  await db.transaction("rw", t, async () => {
    setRemoteApplying(true);
    try {
      if (op === "delete") await t.delete(docId);
      else if (row) await t.put({ ...row, id: docId });
    } finally {
      setRemoteApplying(false);
    }
  });
}

/* ---------------- Ana senkron ---------------- */

export interface SyncResult {
  ok: boolean;
  pushed: number;
  pulled: number;
  message: string;
}

export function runSync(): Promise<SyncResult> {
  // Focus, realtime, interval and manual sync may all fire together. Share
  // one run so they cannot race the cursor or apply records out of order.
  if (activeSync) return activeSync;
  activeSync = performSync().finally(() => {
    activeSync = null;
  });
  return activeSync;
}

async function performSync(): Promise<SyncResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, pushed: 0, pulled: 0, message: "Bulut yapılandırılmadı — yerel mod." };

  syncing = true;
  useSync.getState().patch({ syncing: true, lastError: null });

  let pushed = 0;
  let pulled = 0;
  let outboxBefore = 0;
  try {
    const uid = await userId();
    if (!uid) throw new Error("Senkron için giriş yapmalısın.");
    outboxBefore = await db.outbox.count();
    await flushOutbox();

    for (let i = 0; i < MAX_ROUNDS; i++) {
      const p = await pushOutbox();
      pushed += p;
      if (p === 0) break;
    }
    const pendingAfterPush = await db.outbox.count();
    if (pendingAfterPush > 0) {
      throw new Error(`${pendingAfterPush} değişiklik gönderilemedi; kuyrukta korunuyor.`);
    }
    for (let i = 0; i < MAX_ROUNDS; i++) {
      const c = await pullChanges(uid);
      pulled += c;
      if (c === 0) break;
    }

    await recordSync(Date.now());
    await setMeta("lastSyncResult", { at: Date.now(), pushed, pulled, outboxBefore });
    useSync.getState().patch({ lastAt: Date.now(), lastError: null });
    return { ok: true, pushed, pulled, message: `Senkron tamam · ↑${pushed} ↓${pulled}` };
  } catch (e) {
    const msg = (e as Error).message || "Bilinmeyen hata";
    console.error("[bateo-sync]", msg);
    useSync.getState().patch({ lastError: msg });
    return { ok: false, pushed, pulled, message: `Senkron hatası: ${msg}` };
  } finally {
    syncing = false;
    useSync.getState().patch({ syncing: false });
  }
}

/* ---------------- Otomatik senkron ---------------- */

async function tick(): Promise<void> {
  try {
    const sb = getSupabase();
    if (!sb || syncing) return;
    if (!(await userId())) return;
    const pending = await db.outbox.count();
    const last = (await getMeta<number>("lastSyncAt")) ?? 0;
    if (pending > 0 || Date.now() - last > 60000) void runSync();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Senkron durumu kontrol edilemedi.";
    console.error("[bateo-sync-tick]", message);
    useSync.getState().patch({ lastError: message });
  }
}

function onFocus(): void {
  void tick();
}

function onOnline(): void {
  void runSync();
}

function onVisibilityChange(): void {
  if (document.visibilityState === "visible") void tick();
}

export function startAutoSync(): void {
  if (started) return;
  started = true;
  void runSync();
  window.addEventListener("focus", onFocus);
  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisibilityChange);
  tickTimer = setInterval(() => void tick(), 20000);
  subscribeRealtime();
}

export function stopAutoSync(): void {
  if (!started) return;
  started = false;
  window.removeEventListener("focus", onFocus);
  window.removeEventListener("online", onOnline);
  document.removeEventListener("visibilitychange", onVisibilityChange);
  if (tickTimer !== null) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  unsubscribeRealtime();
}

/* ---------------- Gerçek zamanlı ---------------- */

function subscribeRealtime(): void {
  const sb = getSupabase();
  if (!sb || channel) return;
  channel = sb
    .channel("bateo-records")
    .on("postgres_changes", { event: "*", schema: "public", table: "records" }, () => {
      void runSync();
    })
    .subscribe();
}

function unsubscribeRealtime(): void {
  if (channel) {
    void channel.unsubscribe();
    channel = null;
  }
}
