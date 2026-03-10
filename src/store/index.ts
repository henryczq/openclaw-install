import { create } from 'zustand';
import type { SystemStatus, InstallStep, NavKey, FeishuConfig, QqConfig } from '../types';

interface AppState {
  // 导航
  currentNav: NavKey;
  setCurrentNav: (nav: NavKey) => void;
  
  // 系统状态
  systemStatus: SystemStatus;
  setSystemStatus: (status: Partial<SystemStatus>) => void;
  
  // 安装步骤
  installSteps: InstallStep[];
  setInstallSteps: (steps: InstallStep[]) => void;
  updateStepStatus: (id: string, status: InstallStep['status'], message?: string) => void;
  
  // AI配置
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  
  // 飞书配置
  feishuConfig: FeishuConfig;
  setFeishuConfig: (config: Partial<FeishuConfig>) => void;
  
  // QQ配置
  qqConfig: QqConfig;
  setQqConfig: (config: Partial<QqConfig>) => void;
  
  // 日志
  logs: string[];
  addLog: (log: string) => void;
  clearLogs: () => void;
}

const initialInstallSteps: InstallStep[] = [
  { id: 'check-env', title: '环境检测', description: '检测Node.js、Git等依赖环境', status: 'pending' },
  { id: 'install-node', title: '安装Node.js', description: '下载并安装Node.js (>=22)', status: 'pending' },
  { id: 'config-npm', title: '配置npm', description: '设置国内镜像源', status: 'pending' },
  { id: 'install-git', title: '安装Git', description: '下载并安装Git (>=2)', status: 'pending' },
  { id: 'install-openclaw', title: '安装OpenClaw', description: '执行OpenClaw安装脚本', status: 'pending' },
  { id: 'init-config', title: '初始化配置', description: '创建OpenClaw配置文件', status: 'pending' },
  { id: 'start-gateway', title: '启动网关', description: '启动OpenClaw网关服务', status: 'pending' },
];

export const useAppStore = create<AppState>((set) => ({
  currentNav: 'install',
  setCurrentNav: (nav) => set({ currentNav: nav }),
  
  systemStatus: {
    node: { installed: false, needUpdate: false },
    npm: { installed: false },
    git: { installed: false, needUpdate: false },
    openclaw: { installed: false },
  },
  setSystemStatus: (status) => set((state) => ({
    systemStatus: { ...state.systemStatus, ...status }
  })),
  
  installSteps: initialInstallSteps,
  setInstallSteps: (steps) => set({ installSteps: steps }),
  updateStepStatus: (id, status, message) => set((state) => ({
    installSteps: state.installSteps.map(step =>
      step.id === id ? { ...step, status, message } : step
    )
  })),
  
  selectedModel: 'doubao-seed-2.0-code',
  setSelectedModel: (model) => set({ selectedModel: model }),
  apiKey: '',
  setApiKey: (key) => set({ apiKey: key }),
  
  feishuConfig: { appName: 'openclaw机器人', appDesc: '', appId: '', appSecret: '' },
  setFeishuConfig: (config) => set((state) => ({
    feishuConfig: { ...state.feishuConfig, ...config }
  })),
  
  qqConfig: { appId: '', appSecret: '' },
  setQqConfig: (config) => set((state) => ({
    qqConfig: { ...state.qqConfig, ...config }
  })),
  
  logs: [],
  addLog: (log) => set((state) => ({
    logs: [...state.logs, `[${new Date().toLocaleTimeString()}] ${log}`].slice(-100)
  })),
  clearLogs: () => set({ logs: [] }),
}));
