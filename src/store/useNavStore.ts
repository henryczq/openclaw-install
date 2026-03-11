import { create } from 'zustand';
import type { NavKey } from '../types';

interface NavState {
  currentNav: NavKey;
  setCurrentNav: (nav: NavKey) => void;
}

export const useNavStore = create<NavState>((set) => ({
  currentNav: 'install',
  setCurrentNav: (nav) => set({ currentNav: nav }),
}));
