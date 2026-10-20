import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FocusKind } from "../types";

interface FocusTimerState {
  mode: FocusKind;
  running: boolean;
  round: number;
  courseId: string;
  secondsLeft: number;
  durationSec: number;
  endsAt: number | null;
  startedAt: number | null;
  setMode: (mode: FocusKind, durationSec: number) => void;
  toggle: () => void;
  reset: () => void;
  adjustDuration: (durationSec: number) => void;
  setCourseId: (courseId: string) => void;
  tick: (now: number) => void;
  complete: (nextMode: FocusKind, nextDurationSec: number) => void;
}

export const useFocusTimer = create<FocusTimerState>()(
  persist(
    (set) => ({
      mode: "work",
      running: false,
      round: 0,
      courseId: "",
      secondsLeft: 25 * 60,
      durationSec: 25 * 60,
      endsAt: null,
      startedAt: null,
      setMode: (mode, durationSec) =>
        set({ mode, running: false, secondsLeft: durationSec, durationSec, endsAt: null, startedAt: null }),
      toggle: () =>
        set((state) => {
          if (state.running) {
            const secondsLeft = state.endsAt ? Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000)) : state.secondsLeft;
            return { running: false, secondsLeft, endsAt: null };
          }
          const now = Date.now();
          return {
            running: true,
            endsAt: now + state.secondsLeft * 1000,
            startedAt: state.startedAt ?? now,
          };
        }),
      reset: () =>
        set((state) => ({
          running: false,
          secondsLeft: state.durationSec,
          endsAt: null,
          startedAt: null,
        })),
      adjustDuration: (durationSec) =>
        set((state) =>
          state.running
            ? state
            : { durationSec, secondsLeft: durationSec, endsAt: null, startedAt: null },
        ),
      setCourseId: (courseId) => set({ courseId }),
      tick: (now) =>
        set((state) => {
          if (!state.running || !state.endsAt) return state;
          const secondsLeft = Math.max(0, Math.ceil((state.endsAt - now) / 1000));
          return secondsLeft === state.secondsLeft ? state : { secondsLeft };
        }),
      complete: (nextMode, nextDurationSec) =>
        set((state) => ({
          running: false,
          mode: nextMode,
          round: state.mode === "work" ? state.round + 1 : state.round,
          durationSec: nextDurationSec,
          secondsLeft: nextDurationSec,
          endsAt: null,
          startedAt: null,
        })),
    }),
    {
      name: "bateo-focus-timer",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mode: state.mode,
        running: state.running,
        round: state.round,
        courseId: state.courseId,
        secondsLeft: state.secondsLeft,
        durationSec: state.durationSec,
        endsAt: state.endsAt,
        startedAt: state.startedAt,
      }),
    },
  ),
);
