import type { Flashcard } from "../types";

/**
 * SM-2 (SuperMemo 2) aralıklı tekrar algoritması.
 * Dereceler: 0 = Tekrar, 1 = Zor, 2 = İyi, 3 = Kolay
 */

export type Grade = 0 | 1 | 2 | 3;

const DAY = 86400000;
const MIN_INTERVAL_MIN = 10;

export interface ScheduleResult {
  ease: number;
  interval: number;
  repetitions: number;
  due: number;
  lapses: number;
}

export function scheduleCard(card: Flashcard, grade: Grade, now = Date.now()): ScheduleResult {
  let ease = card.ease || 2.5;
  let interval = card.interval || 0;
  let repetitions = card.repetitions || 0;
  let lapses = card.lapses || 0;

  if (grade === 0) {
    // Tekrar: baştan başla, 10 dk sonra tekrar
    lapses += 1;
    repetitions = 0;
    interval = 0;
    ease = Math.max(1.3, ease - 0.2);
    return { ease, interval, repetitions, due: now + MIN_INTERVAL_MIN * 60000, lapses };
  }

  if (grade === 1) {
    // Zor: aralığı kısalt
    repetitions += 1;
    interval = interval ? Math.max(1, Math.round(interval * 0.6)) : 1;
    ease = Math.max(1.3, ease - 0.15);
    return { ease, interval, repetitions, due: now + interval * DAY, lapses };
  }

  // İyi (2) veya Kolay (3)
  repetitions += 1;
  if (repetitions === 1) interval = 1;
  else if (repetitions === 2) interval = 6;
  else interval = Math.round(Math.max(1, interval) * ease);

  if (grade === 3) {
    ease = Math.min(3.2, ease + 0.15);
    interval = Math.round(interval * 1.15);
  }

  return { ease, interval, repetitions, due: now + interval * DAY, lapses };
}

/** Kart bugün tekrar edilmeli mi? */
export function isDue(card: Flashcard, now = Date.now()): boolean {
  return card.due <= now;
}

export const GRADES: { grade: Grade; label: string; tone: string; hint: string }[] = [
  { grade: 0, label: "Tekrar", tone: "danger", hint: "Bilmedim" },
  { grade: 1, label: "Zor", tone: "warning", hint: "Zorlandım" },
  { grade: 2, label: "İyi", tone: "accent", hint: "Bildim" },
  { grade: 3, label: "Kolay", tone: "success", hint: "Çok kolay" },
];

/** İnsan dostu sıradaki tekrar etiketi */
export function dueLabel(due: number, now = Date.now()): string {
  const diff = due - now;
  if (diff <= 0) return "şimdi";
  if (diff < 3600000) return `${Math.ceil(diff / 60000)} dk sonra`;
  if (diff < DAY) return `${Math.ceil(diff / 3600000)} saat sonra`;
  const days = Math.ceil(diff / DAY);
  return `${days} gün sonra`;
}
