import { useState, useEffect, useCallback, useRef } from 'react';
import { App, message } from 'antd';
import { useAppStore } from '../../../store';

export function useChannelConfig() {
  const { feishuConfig, setFeishuConfig, addLog } = useAppStore();
  const { message: messageApi } = App.useApp();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pluginInstalled, setPluginInstalled] = useState(false);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(true);
  const [rpaProgress, setRpaProgress] = useState<{step: string, status: 'pending'|'running'|'success'|'error', message?: string}[]>([]);
  const currentRpaActionRef = useRef<string | null>(null);

  const notifySuccess = (text: string) => {
    if (messageApi && typeof messageApi.success === 'function') {
      messageApi.success(text);
      return;
    }
    message.success(text);
  };

  const notifyError = (text: string) => {
    if (messageApi && typeof messageApi.error === 'function') {
      messageApi.error(text);
      return;
    }
    message.error(text);
  };

  const notifyWarning = (text: string) => {
    if (messageApi && typeof messageApi.warning === 'function') {
      messageApi.warning(text);
      return;
    }
    message.warning(text);
  };

  const getRpaSteps = useCallback((action: string | null) => {
    if (action === 'install-plugin') {
      return [
        { step: '执行安装命令', status: 'pending' as const },
        { step: '等待安装完成', status: 'pending' as const }
      ];
    }
    if (action === 'login') {
      return [
        { step: '打开飞书开发者后台', status: 'pending' as const },
        { step: '等待扫码登录完成', status: 'pending' as const }
      ];
    }
    if (action === 'create-app') {
      return [
        { step: '等待页面加载', status: 'pending' as const },
        { step: '查找"创建企业自建应用"按钮', status: 'pending' as const },
        { step: '点击创建按钮', status: 'pending' as const },
        { step: '查找名称输入框', status: 'pending' as const },
        { step: '填写应用名称', status: 'pending' as const },
        { step: '查找描述输入框', status: 'pending' as const },
        { step: '填写应用描述', status: 'pending' as const },
        { step: '查找创建/确定按钮', status: 'pending' as const },
        { step: '点击创建按钮', status: 'pending' as const },
        { step: '查找添加机器人按钮', status: 'pending' as const },
        { step: '点击添加机器人', status: 'pending' as const }
      ];
    }
    if (action === 'get-credentials') {
      return [
        { step: '打开凭证与基础信息', status: 'pending' as const },
        { step: '读取 App ID', status: 'pending' as const },
        { step: '读取 App Secret', status: 'pending' as const }
      ];
    }
    if (action === 'config-permissions') {
      return [
        { step: '打开权限管理页面', status: 'pending' as const },
        { step: '点击批量导入/导出权限', status: 'pending' as const },
        { step: '写入权限 JSON', status: 'pending' as const },
        { step: '提交导入', status: 'pending' as const },
        { step: '点击申请开通', status: 'pending' as const },
        { step: '等待确认弹窗', status: 'pending' as const },
        { step: '点击确认', status: 'pending' as const }
      ];
    }
    if (action === 'publish-version') {
      return [
        { step: '打开版本发布页面', status: 'pending' as const },
        { step: '点击创建版本', status: 'pending' as const },
        { step: '填写版本号', status: 'pending' as const },
        { step: '发布版本', status: 'pending' as const }
      ];
    }
    if (action === 'subscribe-events') {
      return [
        { step: '打开事件订阅页面', status: 'pending' as const },
        { step: '添加事件 im.message.receive_v1', status: 'pending' as const },
        { step: '保存订阅配置', status: 'pending' as const }
      ];
    }
    if (action === 'save-config') {
      return [
        { step: '校验 App ID / App Secret', status: 'pending' as const },
        { step: '写入配置并重启', status: 'pending' as const }
      ];
    }
    return [];
  }, []);

  const getRpaActionByStep = useCallback((step: number) => {
    switch (step) {
      case 0: return 'install-plugin';
      case 1: return 'login';
      case 2: return 'create-app';
      case 3: return 'get-credentials';
      case 4: return 'config-permissions';
      case 5: return 'publish-version';
      case 6: return 'subscribe-events';
      case 7: return 'save-config';
      default: return null;
    }
  }, []);

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
    const handleRpaProgress = (progress: { action: string; index: number; status: 'pending'|'running'|'success'|'error'; message?: string }) => {
      if (!progress) return;
      if (currentRpaActionRef.current !== progress.action) {
        currentRpaActionRef.current = progress.action;
        setRpaProgress(getRpaSteps(progress.action));
      }
      setRpaProgress(prev => {
        const next = prev.length ? [...prev] : getRpaSteps(progress.action);
        if (next[progress.index]) {
          next[progress.index] = { ...next[progress.index], status: progress.status, message: progress.message };
        }
        return next;
      });
    };
    if (typeof window.electronAPI.setFeishuRpaProgressHandler === 'function') {
      window.electronAPI.setFeishuRpaProgressHandler(handleRpaProgress);
      return () => {
        window.electronAPI.clearFeishuRpaProgressHandler();
      };
    }
    window.onFeishuRpaProgress = handleRpaProgress;
    return () => {
      window.onFeishuRpaProgress = undefined;
    };
  }, [getRpaSteps]);

  useEffect(() => {
    const action = getRpaActionByStep(currentStep);
    currentRpaActionRef.current = action;
    setRpaProgress(getRpaSteps(action));
  }, [currentStep, getRpaActionByStep, getRpaSteps]);

  useEffect(() => {
    const checkStatus = async () => {
      setIsChecking(false);
    };
    checkStatus();
  }, []);

  const installFeishuPlugin = async () => {
    setIsProcessing(true);
    setInstallLogs([]);
    currentRpaActionRef.current = 'install-plugin';
    setRpaProgress(getRpaSteps('install-plugin'));
    addLog('开始安装飞书插件...');
    
    try {
      setRpaProgress(prev => {
        if (!prev[0]) return prev;
        const next = [...prev];
        next[0] = { ...next[0], status: 'running' };
        return next;
      });
      const result = await window.electronAPI.installFeishuPlugin();
      if (result.success) {
        setPluginInstalled(true);
        setRpaProgress(prev => {
          const next = [...prev];
          if (next[0]) next[0] = { ...next[0], status: 'success' };
          if (next[1]) next[1] = { ...next[1], status: 'success' };
          return next;
        });
        addLog('飞书插件安装成功');
        notifySuccess('飞书插件安装成功');
        setCurrentStep(1);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      addLog(`飞书插件安装失败: ${error}`);
      notifyError(`安装失败: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveFeishuConfig = async () => {
    if (!feishuConfig.appId.trim() || !feishuConfig.appSecret.trim()) {
      setRpaProgress(getRpaSteps('save-config'));
      setRpaProgress(prev => {
        if (!prev[0]) return prev;
        const next = [...prev];
        next[0] = { ...next[0], status: 'error', message: '缺少凭证' };
        return next;
      });
      notifyError('请填写App ID和App Secret');
      return;
    }

    setIsProcessing(true);
    currentRpaActionRef.current = 'save-config';
    setRpaProgress(getRpaSteps('save-config'));
    addLog('正在保存飞书配置...');

    try {
      setRpaProgress(prev => {
        const next = [...prev];
        if (next[0]) next[0] = { ...next[0], status: 'success' };
        if (next[1]) next[1] = { ...next[1], status: 'running' };
        return next;
      });
      const result = await window.electronAPI.configFeishuChannel(
        feishuConfig.appId,
        feishuConfig.appSecret
      );
      if (result.success) {
        addLog('飞书配置保存成功');
        setRpaProgress(prev => {
          const next = [...prev];
          if (next[1]) next[1] = { ...next[1], status: 'success' };
          return next;
        });
        notifySuccess('配置保存成功');
        setCurrentStep(8);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      addLog(`飞书配置保存失败: ${error}`);
      notifyError(`保存失败: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRpaAction = async (action: string) => {
    setIsProcessing(true);
    currentRpaActionRef.current = action;
    setRpaProgress(getRpaSteps(action));

    let result: any;

    const showActionError = (errText: string) => {
      const msg = errText || '执行失败';
      addLog(`${action} 执行失败：${msg}`);
      if (msg.includes('飞书窗口未打开')) {
        notifyWarning('请先执行"登录飞书"打开飞书后台窗口，然后再继续');
        setCurrentStep(1);
        return;
      }
      notifyWarning(msg);
    };

    try {
      switch (action) {
        case 'login':
          result = await window.electronAPI.feishuLogin();
          break;
        case 'create-app':
          setRpaProgress(prev => {
            if (!prev[0]) return prev;
            const next = [...prev];
            next[0] = { ...next[0], status: 'running' };
            return next;
          });
          result = await window.electronAPI.feishuCreateApp({
            appName: feishuConfig.appName,
            appDesc: feishuConfig.appDesc
          });
          if (result.checks) {
            setRpaProgress(prev => {
              const next = [...prev];
              if (next[1]) next[1] = { ...next[1], status: result.checks.createButtonFound ? 'success' : 'error' };
              if (next[3]) next[3] = { ...next[3], status: result.checks.nameInputFound ? 'success' : 'error' };
              if (next[5]) next[5] = { ...next[5], status: result.checks.descInputFound ? 'success' : 'error' };
              if (next[7]) next[7] = { ...next[7], status: result.checks.submitButtonFound ? 'success' : 'error' };
              if (next[9]) next[9] = { ...next[9], status: result.checks.addRobotButtonFound ? 'success' : 'error' };
              return next;
            });
          }
          break;
        case 'config-permissions':
          result = await window.electronAPI.feishuConfigPermissions();
          break;
        case 'publish-version':
          result = await window.electronAPI.feishuPublishVersion();
          break;
        case 'subscribe-events':
          result = await window.electronAPI.feishuSubscribeEvents();
          break;
        case 'get-credentials':
          result = await window.electronAPI.feishuGetCredentials();
          if (result.success && result.data) {
            setFeishuConfig({
              appId: result.data.appId,
              appSecret: result.data.appSecret
            });
            notifySuccess('已自动获取并填写凭证');
          }
          break;
        default:
          showActionError('未知操作');
          return;
      }

      if (!result) {
        showActionError('执行失败');
        return;
      }

      if (result.success) {
        notifySuccess(`${action} 执行成功`);
        setCurrentStep(prev => prev + 1);
      } else {
        showActionError(result.error || '执行失败');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showActionError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    currentStep,
    setCurrentStep,
    isProcessing,
    pluginInstalled,
    installLogs,
    isChecking,
    rpaProgress,
    feishuConfig,
    setFeishuConfig,
    installFeishuPlugin,
    saveFeishuConfig,
    handleRpaAction,
  };
}
