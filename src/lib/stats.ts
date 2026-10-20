import type { FocusSession } from "../types";

const DAY = 86400000;

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b);
}

/** Belirli aralıktaki tamamlanmış odak dakikaları */
export function focusMinutesIn(sessions: FocusSession[], from: number, to: number): number {
  return sessions
    .filter((s) => s.completed && s.kind === "work" && s.startedAt >= from && s.startedAt < to)
    .reduce((sum, s) => sum + Math.round(s.elapsedSeconds / 60), 0);
}

export function todayFocusMinutes(sessions: FocusSession[], now = Date.now()): number {
  const s = startOfDay(now);
  return focusMinutesIn(sessions, s, s + DAY);
}

export interface DayBucket {
  date: number;
  minutes: number;
  label: string;
}

/** Son N günün günlük odak dakikaları */
export function dailyFocus(sessions: FocusSession[], days = 14, now = Date.now()): DayBucket[] {
  const today = startOfDay(now);
  const out: DayBucket[] = [];
  const weekdays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  for (let i = days - 1; i >= 0; i--) {
    const day = today - i * DAY;
    const jsDay = new Date(day).getDay();
    out.push({
      date: day,
      minutes: focusMinutesIn(sessions, day, day + DAY),
      label: weekdays[(jsDay + 6) % 7],
    });
  }
  return out;
}

/** Ardışık gün serisi (bugünden geriye) */
export function currentStreak(sessions: FocusSession[], now = Date.now()): number {
  const daysWith = new Set(
    sessions.filter((s) => s.completed && s.kind === "work").map((s) => startOfDay(s.startedAt)),
  );
  let streak = 0;
  let cursor = startOfDay(now);
  // Bugün çalışılmadıysa dünden başlayarak say
  if (!daysWith.has(cursor)) cursor -= DAY;
  while (daysWith.has(cursor)) {
    streak++;
    cursor -= DAY;
  }
  return streak;
}

/** Isı haritası için son N gün */
export function heatmap(sessions: FocusSession[], days = 91): number[] {
  const today = startOfDay(Date.now());
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = today - i * DAY;
    out.push(focusMinutesIn(sessions, day, day + DAY));
  }
  return out;
}

export interface HeatCell {
  date: number;
  /** -1 = gelecek gün (çizilmez) */
  minutes: number;
}

export interface HeatWeek {
  days: HeatCell[];
}

/** Pazartesi'den başlayarak hafta-hafta ısı haritası (son `weeks` hafta) */
export function heatmapWeeks(sessions: FocusSession[], weeks = 13, now = Date.now()): HeatWeek[] {
  const today = startOfDay(now);
  const todayIdx = (new Date(today).getDay() + 6) % 7; // 0 = Pazartesi
  const lastMonday = today - todayIdx * DAY;
  const firstMonday = lastMonday - (weeks - 1) * 7 * DAY;

  const out: HeatWeek[] = [];
  for (let w = 0; w < weeks; w++) {
    const days: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = firstMonday + (w * 7 + d) * DAY;
      const minutes = date > today ? -1 : focusMinutesIn(sessions, date, date + DAY);
      days.push({ date, minutes });
    }
    out.push({ days });
  }
  return out;
}
