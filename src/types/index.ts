/** BATEO — ortak veri tipleri */

export type Priority = "low" | "normal" | "high";
export type TaskStatus = "todo" | "doing" | "done";

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown
  folderId?: string | null;
  tags: string[];
  color?: string | null;
  pinned: boolean;
  favorite: boolean;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: number | null;
  courseId?: string | null;
  tags: string[];
  subtasks: Subtask[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number | null;
}

export interface Course {
  id: string;
  name: string;
  teacher?: string;
  color: string;
  room?: string;
  credits?: number;
  createdAt: number;
  updatedAt?: number;
}

/** Haftalık ders programı hücresi */
export interface ClassSlot {
  id: string;
  courseId: string;
  day: number; // 0 = Pazartesi ... 6 = Pazar
  start: string; // "09:00"
  end: string; // "10:30"
  room?: string;
  updatedAt?: number;
}

export type FocusKind = "work" | "break";

export interface FocusSession {
  id: string;
  kind: FocusKind;
  minutes: number; // hedeflenen süre
  elapsedSeconds: number;
  courseId?: string | null;
  completed: boolean;
  startedAt: number;
  endedAt?: number | null;
  updatedAt?: number;
}

export interface Exam {
  id: string;
  title: string;
  courseId?: string | null;
  date: number;
  note?: string;
  createdAt: number;
  updatedAt?: number;
}

/* ---------------- Senkron (v2) ---------------- */

/** Yerel değişiklik kuyruğu (outbox) kaydı */
export interface OutboxEntry {
  seq?: number;
  table: string;
  docId: string;
  op: "put" | "delete";
  at: number;
}

/** Anahtar-değer meta tablosu (deviceId, lastSyncAt ...) */
export interface Meta {
  key: string;
  value: unknown;
}

/* ---------------- Kitap okuma listesi (v3) ---------------- */

export type BookStatus = "to-read" | "reading" | "read";

export interface Book {
  id: string;
  title: string;
  author?: string;
  status: BookStatus;
  /** 1-5 yıldız */
  rating?: number;
  startedAt?: number | null;
  finishedAt?: number | null;
  /** kitap sonu düşüncem (HTML) */
  summary?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface BookQuote {
  id: string;
  bookId: string;
  /** Altını çizdiğin söz */
  text: string;
  page?: string;
  /** Bu söz hakkındaki notun */
  note?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Deck {
  id: string;
  name: string;
  color: string;
  courseId?: string | null;
  createdAt: number;
  updatedAt?: number;
}

/** SM-2 aralıklı tekrar durumu taşıyan kart */
export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  /** kolaylık çarpanı (varsayılan 2.5) */
  ease: number;
  /** gün cinsinden aralık */
  interval: number;
  /** ardışık doğru tekrar sayısı */
  repetitions: number;
  /** sıradaki tekrar zamanı (timestamp) */
  due: number;
  lapses: number;
  reviews: number;
  lastReviewedAt?: number | null;
  createdAt: number;
  updatedAt?: number;
}

/** Bir güne ait serbest günlük not / günlük kaydı */
export interface DayEntry {
  id: string; // yyyy-MM-dd
  mood?: number; // 1-5
  note?: string;
  waterGlasses?: number;
  sleepHours?: number;
  updatedAt: number;
}

export type ThemeMode = "dark" | "light";

export interface Settings {
  id: "app";
  theme: ThemeMode;
  accent: string; // hex
  weekStartsMonday: boolean;
  pomodoroWork: number; // dakika
  pomodoroShortBreak: number;
  pomodoroLongBreak: number;
  pomodoroRounds: number;
  dailyGoalMinutes: number;
  weeklyGoalMinutes: number;
  userName: string;
  onboarded: boolean;
  // Bildirimler (v3)
  notifyTasks: boolean;
  notifyExams: boolean;
  notifyPomodoro: boolean;
  reminderHour: number; // 0-23 — günlük görev hatırlatma saati
  themeId: string; // tema kimliği (bkz. src/lib/themes.ts)
}
