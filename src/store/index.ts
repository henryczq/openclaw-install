// 拆分后的独立 Store
export { useNavStore } from './useNavStore';
export { useSystemStore } from './useSystemStore';
export { useInstallStore } from './useInstallStore';
export { useAIStore } from './useAIStore';
export { useChannelStore } from './useChannelStore';
export { useLogStore } from './useLogStore';

// 为了向后兼容，保留 useAppStore 作为组合导出
// 新项目建议使用独立的 store
import { useNavStore } from './useNavStore';
import { useSystemStore } from './useSystemStore';
import { useInstallStore } from './useInstallStore';
import { useAIStore } from './useAIStore';
import { useChannelStore } from './useChannelStore';
import { useLogStore } from './useLogStore';

/**
 * @deprecated 建议使用独立的 store: useNavStore, useSystemStore 等
 * 保留此导出以兼容现有代码
 */
export const useAppStore = () => {
  const nav = useNavStore();
  const system = useSystemStore();
  const install = useInstallStore();
  const ai = useAIStore();
  const channel = useChannelStore();
  const log = useLogStore();

  return {
    // Nav
    currentNav: nav.currentNav,
    setCurrentNav: nav.setCurrentNav,
    // System
    systemStatus: system.systemStatus,
    setSystemStatus: system.setSystemStatus,
    // Install
    installSteps: install.installSteps,
    setInstallSteps: install.setInstallSteps,
    updateStepStatus: install.updateStepStatus,
    // AI
    selectedModel: ai.selectedModel,
    setSelectedModel: ai.setSelectedModel,
    apiKey: ai.apiKey,
    setApiKey: ai.setApiKey,
    // Channel
    feishuConfig: channel.feishuConfig,
    setFeishuConfig: channel.setFeishuConfig,
    qqConfig: channel.qqConfig,
    setQqConfig: channel.setQqConfig,
    // Log
    logs: log.logs,
    addLog: log.addLog,
    clearLogs: log.clearLogs,
  };
};
