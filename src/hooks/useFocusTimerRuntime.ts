import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_SETTINGS, getSettings } from "../db/db";
import { uid } from "../lib/id";
import { notifyNow } from "../lib/notify";
import { useFocusTimer } from "../store/focusTimer";

function playCompletionSound(): void {
  try {
    const AudioContextCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.type = "sine";
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.9);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.95);
  } catch {
    // Audio playback may be unavailable; the timer and notification still work.
  }
}

/** Keeps the Pomodoro clock alive while route screens mount and unmount. */
export function useFocusTimerRuntime(): void {
  const settings = useLiveQuery(() => getSettings(), [], DEFAULT_SETTINGS);
  const running = useFocusTimer((state) => state.running);
  const secondsLeft = useFocusTimer((state) => state.secondsLeft);

  useEffect(() => {
    const timer = useFocusTimer.getState();
    if (timer.running) return;
    const nextDuration = timer.mode === "work"
      ? settings.pomodoroWork
      : timer.round > 0 && timer.round % settings.pomodoroRounds === 0
        ? settings.pomodoroLongBreak
        : settings.pomodoroShortBreak;
    if (timer.durationSec !== nextDuration * 60) timer.adjustDuration(nextDuration * 60);
  }, [settings.pomodoroWork, settings.pomodoroShortBreak, settings.pomodoroLongBreak, settings.pomodoroRounds]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => useFocusTimer.getState().tick(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running || secondsLeft !== 0) return;
    const timer = useFocusTimer.getState();
    const mode = timer.mode;
    const durationSec = timer.durationSec;
    const startedAt = timer.startedAt ?? Date.now() - durationSec * 1000;
    const endedAt = Date.now();
    playCompletionSound();

    // complete() stops the timer synchronously, preventing duplicate session writes.
    const nextRound = mode === "work" ? timer.round + 1 : timer.round;
    const nextMode = mode === "work" ? "break" : "work";
    const nextDuration =
      nextMode === "work"
        ? settings.pomodoroWork
        : nextRound % settings.pomodoroRounds === 0
          ? settings.pomodoroLongBreak
          : settings.pomodoroShortBreak;
    timer.complete(nextMode, nextDuration * 60);

    void db.focusSessions.add({
      id: uid("fs"),
      kind: mode,
      minutes: Math.round(durationSec / 60),
      elapsedSeconds: durationSec,
      courseId: timer.courseId || null,
      completed: true,
      startedAt,
      endedAt,
    });

    if (settings.notifyPomodoro) {
      const title = mode === "work" ? "Odak tamamlandı 🎉" : "Mola bitti 💪";
      const body = mode === "work" ? "Çalışma seansı tamamlandı. Mola zamanı." : "Tekrar odaklanma zamanı.";
      void notifyNow(title, body);
    }
  }, [running, secondsLeft, settings]);
}
