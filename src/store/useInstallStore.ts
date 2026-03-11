import { create } from 'zustand';
import type { InstallStep } from '../types';

interface InstallState {
  installSteps: InstallStep[];
  setInstallSteps: (steps: InstallStep[]) => void;
  updateStepStatus: (id: string, status: InstallStep['status'], message?: string) => void;
}

const initialInstallSteps: InstallStep[] = [
  { id: 'check-env', title: '环境检测', description: '检测Node.js、Git等依赖环境', status: 'pending' },
  { id: 'install-vcredist', title: '安装VC++运行库', description: '安装微软Visual C++运行库', status: 'pending' },
  { id: 'install-node', title: '安装Node.js', description: '下载并安装Node.js (>=22)', status: 'pending' },
  { id: 'config-npm', title: '配置npm', description: '设置国内镜像源', status: 'pending' },
  { id: 'install-git', title: '安装Git', description: '下载并安装Git (>=2)', status: 'pending' },
  { id: 'install-openclaw', title: '安装OpenClaw', description: '执行OpenClaw安装脚本', status: 'pending' },
  { id: 'init-config', title: '初始化配置', description: '创建OpenClaw配置文件', status: 'pending' },
  { id: 'start-gateway', title: '启动网关', description: '启动OpenClaw网关服务', status: 'pending' },
];

export const useInstallStore = create<InstallState>((set) => ({
  installSteps: initialInstallSteps,
  setInstallSteps: (steps) => set({ installSteps: steps }),
  updateStepStatus: (id, status, message) => set((state) => ({
    installSteps: state.installSteps.map(step =>
      step.id === id ? { ...step, status, message } : step
    )
  })),
}));
