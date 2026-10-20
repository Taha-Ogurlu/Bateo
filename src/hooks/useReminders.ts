import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, getMeta, setMeta } from "../db/db";
import { useSettings } from "./useSettings";
import { notifyNow } from "../lib/notify";

const DAY = 86400000;
const LOG_KEY = "reminderLog";

function dayKeyOf(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Hatırlatıcılar (v3): uygulama açıkken düzenli kontrol eder.
 * - Günlük görev özeti (belirlenen saatte, günde bir)
 * - Sınav yaklaşımı (7 gün ve 1 gün kala, her biri bir kez)
 * Tekrarları `meta.reminderLog` ile engeller.
 */
export function useReminders(): void {
  const settings = useSettings();
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []);
  const exams = useLiveQuery(() => db.exams.toArray(), [], []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const now = Date.now();
      const todayStart = new Date(now).setHours(0, 0, 0, 0);
      const reminderTime = todayStart + settings.reminderHour * 3600000;
      const log = (await getMeta<Record<string, number>>(LOG_KEY)) ?? {};
      let changed = false;

      // 1) Günlük görev özeti
      if (settings.notifyTasks && now >= reminderTime) {
        const key = `digest:${dayKeyOf(now)}`;
        const due = tasks.filter(
          (t) => t.status !== "done" && t.dueDate && t.dueDate < todayStart + DAY && !t.completedAt,
        );
        if (due.length > 0 && !log[key]) {
          const titles = due.slice(0, 3).map((t) => t.title).join(" · ");
          await notifyNow(
            `Bugün ${due.length} görevin var`,
            titles + (due.length > 3 ? ` +${due.length - 3} daha` : ""),
          );
          log[key] = now;
          changed = true;
        }
      }

      // 2) Sınav hatırlatıcıları
      if (settings.notifyExams) {
        for (const e of exams) {
          const daysLeft = Math.ceil((e.date - todayStart) / DAY);
          const milestone = daysLeft <= 1 ? 1 : daysLeft <= 7 ? 7 : null;
          if (milestone === null || daysLeft < 0) continue;
          const key = `exam:${e.id}:${milestone}`;
          if (!log[key]) {
            await notifyNow(
              "Sınav yaklaşıyor 📚",
              `${e.title} — ${daysLeft <= 0 ? "bugün!" : `${daysLeft} gün kaldı`}`,
            );
            log[key] = now;
            changed = true;
          }
        }
      }

      // Eski kayıtları temizle (30 gün)
      const cutoff = now - 30 * DAY;
      for (const k of Object.keys(log)) {
        if (log[k] < cutoff) {
          delete log[k];
          changed = true;
        }
      }

      if (changed && !cancelled) await setMeta(LOG_KEY, log);
    };

    void run();
    const timer = window.setInterval(() => void run(), 60000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [settings.notifyTasks, settings.notifyExams, settings.reminderHour, tasks, exams]);
}
