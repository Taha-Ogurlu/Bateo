import { create } from "zustand";

interface SyncStore {
  syncing: boolean;
  lastError: string | null;
  lastAt: number | null;
  patch: (p: Partial<Omit<SyncStore, "patch">>) => void;
}

export const useSync = create<SyncStore>((set) => ({
  syncing: false,
  lastError: null,
  lastAt: null,
  patch: (p) => set(p),
}));
