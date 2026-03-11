import { create } from 'zustand';

interface LogState {
  logs: string[];
  addLog: (log: string) => void;
  clearLogs: () => void;
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  addLog: (log) => set((state) => ({
    logs: [...state.logs, `[${new Date().toLocaleTimeString()}] ${log}`].slice(-100)
  })),
  clearLogs: () => set({ logs: [] }),
}));
