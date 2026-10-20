import Dexie, { type Table } from "dexie";
import { uid } from "../lib/id";
import type {
  Note,
  Folder,
  Task,
  Course,
  ClassSlot,
  FocusSession,
  Exam,
  DayEntry,
  Settings,
  OutboxEntry,
  Meta,
  Deck,
  Flashcard,
  Book,
  BookQuote,
} from "../types";

/** Senkronize edilen tablolar (settings hariç — cihaza özel) */
export const SYNCED_TABLES = [
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

/* ------------------------------------------------------------
   Outbox (yerel değişiklik kuyruğu)
   Dexie hook'ları her yazmayı burada kaydeder; senkron motoru
   bunları buluta iter. Uzak güncellemeler uygulanırken
   (setRemoteApplying) kuyruğa yazılmaz.
   ------------------------------------------------------------ */

let remoteApplying = false;
let pendingOutbox: OutboxEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushPromise: Promise<void> | null = null;

export function setRemoteApplying(v: boolean): void {
  remoteApplying = v;
}

function enqueue(table: string, docId: string, op: "put" | "delete"): void {
  if (remoteApplying) return;
  pendingOutbox.push({ table, docId, op, at: Date.now() });
  if (flushTimer === null) {
    flushTimer = setTimeout(() => {
      void flushOutbox().catch((error) => console.error("[bateo-outbox]", error));
    }, 0);
  }
}

/** Bekleyen kuyruğu veritabanına yazar */
export async function flushOutbox(): Promise<void> {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (flushPromise) {
    await flushPromise;
    if (pendingOutbox.length > 0) await flushOutbox();
    return;
  }
  if (pendingOutbox.length === 0) return;
  const batch = pendingOutbox.splice(0, pendingOutbox.length);
  flushPromise = db.outbox.bulkAdd(batch).then(() => undefined).catch((error) => {
    // Keep writes in memory if IndexedDB could not persist them. Silently
    // dropping this batch makes a later sign-out permanently lose user data.
    pendingOutbox = [...batch, ...pendingOutbox];
    throw error;
  }).finally(() => {
    flushPromise = null;
  });
  await flushPromise;
  if (pendingOutbox.length > 0) await flushOutbox();
}

/** Veriler bilerek tamamen silinirken kuyruktaki yerel yazmaları da düşür. */
export async function discardPendingOutbox(): Promise<void> {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  try {
    if (flushPromise) await flushPromise;
  } catch {
    // This helper is used only when the caller deliberately discards data.
    // Remove the failed in-memory batch below so it cannot be flushed later.
  }
  pendingOutbox = [];
  await db.outbox.clear();
}

/**
 * BATEO yerel veritabanı (IndexedDB / Dexie).
 * v2: outbox + meta (deviceId, lastSyncAt) ve otomatik updatedAt.
 */
export class BateoDB extends Dexie {
  notes!: Table<Note, string>;
  folders!: Table<Folder, string>;
  tasks!: Table<Task, string>;
  courses!: Table<Course, string>;
  classSlots!: Table<ClassSlot, string>;
  focusSessions!: Table<FocusSession, string>;
  exams!: Table<Exam, string>;
  dayEntries!: Table<DayEntry, string>;
  decks!: Table<Deck, string>;
  flashcards!: Table<Flashcard, string>;
  books!: Table<Book, string>;
  bookQuotes!: Table<BookQuote, string>;
  settings!: Table<Settings, string>;
  outbox!: Table<OutboxEntry, number>;
  meta!: Table<Meta, string>;

  constructor() {
    super("bateo");

    this.version(1).stores({
      notes: "id, title, folderId, updatedAt, pinned, favorite, archived, *tags",
      folders: "id, name, createdAt",
      tasks: "id, status, priority, dueDate, courseId, createdAt, updatedAt, *tags",
      courses: "id, name, createdAt",
      classSlots: "id, courseId, day, [day+start]",
      focusSessions: "id, kind, courseId, startedAt, completed",
      exams: "id, date, courseId",
      dayEntries: "id, updatedAt",
      settings: "id",
    });

    this.version(2).stores({
      notes: "id, title, folderId, updatedAt, pinned, favorite, archived, *tags",
      folders: "id, name, createdAt, updatedAt",
      tasks: "id, status, priority, dueDate, courseId, createdAt, updatedAt, *tags",
      courses: "id, name, createdAt, updatedAt",
      classSlots: "id, courseId, day, [day+start], updatedAt",
      focusSessions: "id, kind, courseId, startedAt, completed, updatedAt",
      exams: "id, date, courseId, updatedAt",
      dayEntries: "id, updatedAt",
      settings: "id",
      outbox: "++seq, table, docId, at",
      meta: "key",
    });

    this.version(3).stores({
      notes: "id, title, folderId, updatedAt, pinned, favorite, archived, *tags",
      folders: "id, name, createdAt, updatedAt",
      tasks: "id, status, priority, dueDate, courseId, createdAt, updatedAt, *tags",
      courses: "id, name, createdAt, updatedAt",
      classSlots: "id, courseId, day, [day+start], updatedAt",
      focusSessions: "id, kind, courseId, startedAt, completed, updatedAt",
      exams: "id, date, courseId, updatedAt",
      dayEntries: "id, updatedAt",
      settings: "id",
      outbox: "++seq, table, docId, at",
      meta: "key",
      decks: "id, name, courseId, createdAt, updatedAt",
      flashcards: "id, deckId, due, createdAt, updatedAt",
    });

    this.version(4).stores({
      notes: "id, title, folderId, updatedAt, pinned, favorite, archived, *tags",
      folders: "id, name, createdAt, updatedAt",
      tasks: "id, status, priority, dueDate, courseId, createdAt, updatedAt, *tags",
      courses: "id, name, createdAt, updatedAt",
      classSlots: "id, courseId, day, [day+start], updatedAt",
      focusSessions: "id, kind, courseId, startedAt, completed, updatedAt",
      exams: "id, date, courseId, updatedAt",
      dayEntries: "id, updatedAt",
      settings: "id",
      outbox: "++seq, table, docId, at",
      meta: "key",
      decks: "id, name, courseId, createdAt, updatedAt",
      flashcards: "id, deckId, due, createdAt, updatedAt",
    });

    // v5: Kitap okuma listesi eklendi
    this.version(5).stores({
      notes: "id, title, folderId, updatedAt, pinned, favorite, archived, *tags",
      folders: "id, name, createdAt, updatedAt",
      tasks: "id, status, priority, dueDate, courseId, createdAt, updatedAt, *tags",
      courses: "id, name, createdAt, updatedAt",
      classSlots: "id, courseId, day, [day+start], updatedAt",
      focusSessions: "id, kind, courseId, startedAt, completed, updatedAt",
      exams: "id, date, courseId, updatedAt",
      dayEntries: "id, updatedAt",
      settings: "id",
      outbox: "++seq, table, docId, at",
      meta: "key",
      decks: "id, name, courseId, createdAt, updatedAt",
      flashcards: "id, deckId, due, createdAt, updatedAt",
      books: "id, title, author, status, createdAt, updatedAt",
      bookQuotes: "id, bookId, createdAt, updatedAt",
    });

    // v6: Psikoloji tabloları tamamen kaldırıldı (temiz kurulum)
    this.version(6).stores({
      notes: "id, title, folderId, updatedAt, pinned, favorite, archived, *tags",
      folders: "id, name, createdAt, updatedAt",
      tasks: "id, status, priority, dueDate, courseId, createdAt, updatedAt, *tags",
      courses: "id, name, createdAt, updatedAt",
      classSlots: "id, courseId, day, [day+start], updatedAt",
      focusSessions: "id, kind, courseId, startedAt, completed, updatedAt",
      exams: "id, date, courseId, updatedAt",
      dayEntries: "id, updatedAt",
      settings: "id",
      outbox: "++seq, table, docId, at",
      meta: "key",
      decks: "id, name, courseId, createdAt, updatedAt",
      flashcards: "id, deckId, due, createdAt, updatedAt",
      books: "id, title, author, status, createdAt, updatedAt",
      bookQuotes: "id, bookId, createdAt, updatedAt",
    });

    // Her yazmayı otomatik izle: updatedAt ata + outbox'a ekle
    for (const name of SYNCED_TABLES) {
      // Dexie hook tipleri tabloya özel; esneklik için any kullanıyoruz
      const t = this.table(name) as {
        hook: (event: string, cb: (...args: unknown[]) => void) => void;
      };
      t.hook("creating", (_pk, obj) => {
        const o = obj as Record<string, unknown>;
        if (o.updatedAt === undefined) o.updatedAt = Date.now();
        enqueue(name, String(o.id), "put");
      });
      t.hook("updating", (mods, pk) => {
        const m = mods as Record<string, unknown>;
        if (m.updatedAt === undefined) m.updatedAt = Date.now();
        enqueue(name, String(pk), "put");
      });
      t.hook("deleting", (pk) => {
        enqueue(name, String(pk), "delete");
      });
    }
  }
}

export const db = new BateoDB();

/* ---------------- Ayarlar ---------------- */

export const DEFAULT_SETTINGS: Settings = {
  id: "app",
  theme: "dark",
  accent: "#8ea0ff",
  weekStartsMonday: true,
  pomodoroWork: 25,
  pomodoroShortBreak: 5,
  pomodoroLongBreak: 15,
  pomodoroRounds: 4,
  dailyGoalMinutes: 120,
  weeklyGoalMinutes: 600,
  userName: "",
  onboarded: false,
  notifyTasks: true,
  notifyExams: true,
  notifyPomodoro: true,
  reminderHour: 9,
  themeId: "gece",
};

/** Ayarları getir (salt-okunur; canlı sorgu içinde güvenli) */
export async function getSettings(): Promise<Settings> {
  return (await db.settings.get("app")) ?? DEFAULT_SETTINGS;
}

/** Ayarlar satırı yoksa oluştur (uygulama başlangıcında bir kez çağrılır) */
export async function ensureSettings(): Promise<void> {
  const existing = await db.settings.get("app");
  if (!existing) await db.settings.put(DEFAULT_SETTINGS);
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch, id: "app" });
}

/* ---------------- Meta & cihaz ---------------- */

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await db.meta.get(key);
  return row?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value });
}

/** Bu cihazın kalıcı kimliği (yoksa oluşturur — yazma yapar) */
export async function ensureDeviceId(): Promise<string> {
  const existing = await getMeta<string>("deviceId");
  if (existing) return existing;
  const id = uid("dev");
  await setMeta("deviceId", id);
  return id;
}

/** Yalnızca okur (canlı sorgu içinde güvenli) */
export async function readDeviceId(): Promise<string> {
  return (await getMeta<string>("deviceId")) ?? "";
}
