import { create } from 'zustand';
import type { FeishuConfig, QqConfig } from '../types';

interface ChannelState {
  feishuConfig: FeishuConfig;
  setFeishuConfig: (config: Partial<FeishuConfig>) => void;
  qqConfig: QqConfig;
  setQqConfig: (config: Partial<QqConfig>) => void;
}

const initialFeishuConfig: FeishuConfig = {
  appName: 'openclaw机器人',
  appDesc: '',
  appId: '',
  appSecret: ''
};

const initialQqConfig: QqConfig = {
  appId: '',
  appSecret: ''
};

export const useChannelStore = create<ChannelState>((set) => ({
  feishuConfig: initialFeishuConfig,
  setFeishuConfig: (config) => set((state) => ({
    feishuConfig: { ...state.feishuConfig, ...config }
  })),
  qqConfig: initialQqConfig,
  setQqConfig: (config) => set((state) => ({
    qqConfig: { ...state.qqConfig, ...config }
  })),
}));
