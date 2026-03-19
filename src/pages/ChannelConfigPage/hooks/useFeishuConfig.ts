import { useState, useEffect, useCallback } from 'react';
import { App } from 'antd';
import { useAppStore } from '../../../store';

export function useFeishuConfig() {
  const { addLog } = useAppStore();
  const { message: messageApi } = App.useApp();

  const [isProcessing, setIsProcessing] = useState(false);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(true);
  const [openclawInstalled, setOpenclawInstalled] = useState<boolean | null>(null);
  const [installComplete, setInstallComplete] = useState(false);

  const notifySuccess = useCallback((text: string) => {
    messageApi?.success(text);
  }, [messageApi]);

  const notifyError = useCallback((text: string) => {
    messageApi?.error(text);
  }, [messageApi]);

  useEffect(() => {
    const handleInstallProgress = (output: string) => {
      setInstallLogs(prev => [...prev, output]);
    };
    if (typeof window.electronAPI.setFeishuInstallProgressHandler === 'function') {
      window.electronAPI.setFeishuInstallProgressHandler(handleInstallProgress);
      return () => {
        window.electronAPI.clearFeishuInstallProgressHandler();
      };
    }
    window.onFeishuInstallProgress = handleInstallProgress;
    return () => {
      window.onFeishuInstallProgress = undefined;
    };
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      setIsChecking(true);
      try {
        const result = await window.electronAPI.checkOpenClaw();
        setOpenclawInstalled(result.installed);
        if (!result.installed) {
          notifyError('OpenClaw 未安装，请先安装 OpenClaw');
        }
      } catch (error) {
        console.error('检查 OpenClaw 失败:', error);
        setOpenclawInstalled(false);
        notifyError('检查 OpenClaw 失败');
      } finally {
        setIsChecking(false);
      }
    };
    checkStatus();
  }, [notifyError]);

  const installFeishuPlugin = async () => {
    setIsProcessing(true);
    setInstallLogs([]);
    setInstallComplete(false);
    addLog('开始飞书配置安装...');

    try {
      const result = await window.electronAPI.installFeishuPlugin();
      
      if (result.success) {
        addLog('飞书配置安装成功');
        notifySuccess('飞书配置安装成功！');
        setInstallComplete(true);
      } else {
        throw new Error(result.error || '安装失败');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`飞书配置安装失败: ${errorMsg}`);
      notifyError(`安装失败: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const openManualConfigConsole = async () => {
    addLog('打开控制台手动配置...');
    try {
      // 打开 cmd 窗口，执行 openclaw channels add，让用户自己操作
      const result = await window.electronAPI.executeCommand(
        'start cmd /k openclaw channels add',
        { showWindow: true }
      );
      
      if (result.success) {
        addLog('已打开控制台窗口');
      } else {
        throw new Error(result.error || '打开控制台失败');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`打开控制台失败: ${errorMsg}`);
      notifyError(`打开控制台失败: ${errorMsg}`);
    }
  };

  return {
    isProcessing,
    installLogs,
    isChecking,
    openclawInstalled,
    installComplete,
    installFeishuPlugin,
    openManualConfigConsole,
  };
}
