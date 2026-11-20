import { create } from 'zustand';

interface UiState {
  introDone: boolean;
  menuOpen: boolean;
  setIntroDone: () => void;
  setMenuOpen: (open: boolean) => void;
}

export const useUi = create<UiState>()((set) => ({
  introDone: true,
  menuOpen: false,
  setIntroDone: () => set({ introDone: true }),
  setMenuOpen: (open) => set({ menuOpen: open }),
}));
