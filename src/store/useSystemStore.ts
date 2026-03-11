import { create } from 'zustand';
import type { SystemStatus } from '../types';

interface SystemState {
  systemStatus: SystemStatus;
  setSystemStatus: (status: Partial<SystemStatus>) => void;
}

const initialSystemStatus: SystemStatus = {
  node: { installed: false, needUpdate: false },
  npm: { installed: false },
  git: { installed: false, needUpdate: false },
  openclaw: { installed: false },
  vcredist: { installed: false },
};

export const useSystemStore = create<SystemState>((set) => ({
  systemStatus: initialSystemStatus,
  setSystemStatus: (status) => set((state) => ({
    systemStatus: { ...state.systemStatus, ...status }
  })),
}));
