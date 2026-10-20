import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;

  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  togglePalette: () => void;

  quickAddOpen: boolean;
  setQuickAddOpen: (v: boolean) => void;

  focusMode: boolean;
  setFocusMode: (v: boolean) => void;
}

export const useUI = create<UIState>()(persist((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  paletteOpen: false,
  setPaletteOpen: (v) => set({ paletteOpen: v }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),

  quickAddOpen: false,
  setQuickAddOpen: (v) => set({ quickAddOpen: v }),

  focusMode: false,
  setFocusMode: (v) => set({ focusMode: v }),
}), {
  name: "bateo-ui-preferences",
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }) as UIState,
}));
