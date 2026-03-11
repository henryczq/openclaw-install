import { useState, useCallback } from 'react';
import { App } from 'antd';
import { useAppStore } from '../../../store';
import {
  getQqRpaSteps,
  updateAllQqProgressItems,
  updateQqProgressItems,
  type QqAction,
  type QqProgressItem
} from './qqConfigProgress';

export function useQqConfig() {
  const { qqConfig, setQqConfig, addLog: storeAddLog } = useAppStore();
  const { message: messageApi } = App.useApp();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pluginInstalled, setPluginInstalled] = useState(false);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [rpaProgress, setRpaProgress] = useState<QqProgressItem[]>([]);

  const notifySuccess = useCallback((text: string) => {
    messageApi?.success(text);
  }, [messageApi]);

  const notifyError = useCallback((text: string) => {
    messageApi?.error(text);
  }, [messageApi]);

  const addLog = useCallback((log: string) => {
    setInstallLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
    storeAddLog(log);
  }, [storeAddLog]);

  const wait = useCallback((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)), []);

  const getErrorMessage = useCallback((error: unknown) => (
    error instanceof Error ? error.message : String(error)
  ), []);

  const startAction = useCallback((action: QqAction, logMessage: string, options?: { resetLogs?: boolean }) => {
    setIsProcessing(true);
    if (options?.resetLogs) {
      setInstallLogs([]);
    }
    setRpaProgress(getQqRpaSteps(action));
    addLog(logMessage);
  }, [addLog]);

  const updateProgress = useCallback((indexes: number | number[], patch: Partial<QqProgressItem>) => {
    setRpaProgress((prev) => updateQqProgressItems(prev, indexes, patch));
  }, []);

  const updateAllProgress = useCallback((patch: Partial<QqProgressItem>) => {
    setRpaProgress((prev) => updateAllQqProgressItems(prev, patch));
  }, []);

  const checkPlugin = async () => {
    startAction('check-plugin', '正在检查QQ插件...');

    try {
      updateProgress(0, { status: 'running' });

      const result = await window.electronAPI.checkQqPlugin();
      console.log('检查插件结果:', result);

      if (result.installed) {
        setPluginInstalled(true);
        updateProgress(0, { status: 'success', message: '插件已安装' });
        addLog('QQ插件已安装');
        addLog(`插件列表: ${result.output}`);
        notifySuccess('QQ插件已安装');
        setCurrentStep(2);
      } else {
        setPluginInstalled(false);
        updateProgress(0, { status: 'error', message: '插件未安装' });
        addLog('QQ插件未安装，需要先安装插件');
        if (result.output) {
          addLog(`插件列表: ${result.output}`);
        }
        notifyError('QQ插件未安装，请先安装插件');
        setCurrentStep(1);
      }
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      console.error('检查插件异常:', error);
      updateProgress(0, { status: 'error', message: errorMsg });
      addLog(`检查插件失败: ${errorMsg}`);
      notifyError(`检查插件失败: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const installPlugin = async () => {
    startAction('install-plugin', '开始安装QQ插件...', { resetLogs: true });
    
    try {
      updateProgress(0, { status: 'running' });
      
      const result = await window.electronAPI.installQqPlugin();
      
      if (result.success) {
        setPluginInstalled(true);
        updateProgress([0, 1], { status: 'success' });
        addLog('QQ插件安装成功');
        notifySuccess('QQ插件安装成功');
        setCurrentStep(2);
      } else {
        throw new Error(result.error || '安装失败');
      }
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      addLog(`安装失败: ${errorMsg}`);
      notifyError(`安装失败: ${errorMsg}`);
      updateAllProgress({ status: 'error', message: errorMsg });
    } finally {
      setIsProcessing(false);
    }
  };

  const openConsole = async () => {
    startAction('open-console', '正在打开QQ机器人管理页面...');

    try {
      updateProgress(0, { status: 'running' });

      console.log('[openConsole] 调用 openQqConsole...');
      const result = await window.electronAPI.openQqConsole();
      console.log('[openConsole] openQqConsole 返回:', result);

      if (result.success) {
        console.log('[openConsole] 页面打开成功');
        updateProgress(0, { status: 'success' });
        addLog('已打开QQ机器人管理页面');
        console.log('[openConsole] 页面已打开，准备等待5秒后检查登录状态');
        
        // 等待5秒后检查登录状态
        addLog('等待5秒后检查登录状态...');
        console.log('[openConsole] 开始等待5秒...');
        await wait(5000);
        console.log('[openConsole] 5秒等待结束');
        
        console.log('[openConsole] 开始检查登录状态');
        addLog('正在检测登录状态...');
        
        try {
          console.log('[openConsole] 调用 qqCheckLogin...');
          const checkResult = await window.electronAPI.qqCheckLogin();
          console.log('[openConsole] 登录状态检查结果:', checkResult);
          
          const isLoggedIn = checkResult.loggedIn || false;
          console.log('[openConsole] 是否已登录:', isLoggedIn);
          
          if (isLoggedIn) {
            addLog('检测到已登录，自动创建机器人...');
            notifySuccess('检测到已登录，自动创建机器人');
            setCurrentStep(3);
            await createRobot();
          } else {
            addLog('未检测到登录，请扫码登录后点击"下一步"继续');
            notifySuccess('请扫码登录后点击"下一步"继续');
            setCurrentStep(3);
            // 不停止页面，让用户继续操作
          }
        } catch (checkError) {
          console.error('[openConsole] 检查登录状态出错:', checkError);
          addLog('检查登录状态出错，请扫码登录后点击"下一步"继续');
          notifySuccess('请扫码登录后点击"下一步"继续');
          setCurrentStep(3);
        }
      } else {
          console.log('[openConsole] 页面打开失败:', result.error);
          throw new Error(result.error || '打开失败');
        }
        
        // 流程完成，释放 processing 状态
        console.log('[openConsole] 流程完成，释放 processing 状态');
        setIsProcessing(false);
        
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      addLog(`打开页面失败: ${errorMsg}`);
      notifyError('打开页面失败');
      setIsProcessing(false);
    }
  };

  const createRobot = async () => {
    startAction('create-robot', '正在创建QQ机器人...');
    
    try {
      updateProgress(0, { status: 'running' });
      
      const result = await window.electronAPI.qqCreateRobot();
      
      if (result.success) {
        updateProgress([0, 1], { status: 'success' });
        addLog('QQ机器人创建成功');
        notifySuccess('QQ机器人创建成功');
        setCurrentStep(4);
        
        // 等待3秒后自动继续执行第5步：获取凭证
        addLog('等待3秒后自动继续：获取凭证...');
        await wait(3000);
        await getCredentials();
      } else {
        throw new Error(result.error || '创建失败');
      }
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      addLog(`创建失败: ${errorMsg}`);
      notifyError(`创建失败: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getCredentials = async () => {
    startAction('get-credentials', '正在获取AppID和AppSecret...');
    
    try {
      updateProgress(0, { status: 'running' });
      
      const result = await window.electronAPI.qqGetCredentials();
      
      if (result.success && result.data) {
        const { appId, appSecret } = result.data;
        setQqConfig({
          appId,
          appSecret
        });
        updateProgress([0, 1], { status: 'success' });
        addLog(`获取凭证成功: AppID=${appId}`);
        notifySuccess('获取凭证成功');
        setCurrentStep(5);
        
        // 等待3秒后自动继续执行第6步：绑定机器人
        addLog('等待3秒后自动继续：绑定机器人...');
        await wait(3000);
        // 直接传入获取到的凭证，避免状态异步问题
        await bindChannelWithCredentials(appId, appSecret);
      } else {
        throw new Error(result.error || '获取失败');
      }
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      addLog(`获取凭证失败: ${errorMsg}`);
      notifyError(`获取凭证失败: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const bindChannelWithCredentials = async (appId: string, appSecret: string) => {
    startAction('bind-channel', '正在绑定QQ机器人...');
    
    try {
      updateProgress(0, { status: 'running' });
      
      const result = await window.electronAPI.configQqChannel(appId, appSecret);
      
      if (result.success) {
        updateProgress(0, { status: 'success' });
        addLog('QQ机器人绑定成功');
        notifySuccess('QQ机器人绑定成功');
        setCurrentStep(6);
        
        // 等待3秒后自动继续执行第7步：重启服务
        addLog('等待3秒后自动继续：重启服务...');
        await wait(3000);
        await restartService();
      } else {
        throw new Error(result.error || '绑定失败');
      }
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      addLog(`绑定失败: ${errorMsg}`);
      notifyError(`绑定失败: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const bindChannel = async () => {
    if (!qqConfig.appId || !qqConfig.appSecret) {
      notifyError('请先获取AppID和AppSecret');
      return;
    }
    await bindChannelWithCredentials(qqConfig.appId, qqConfig.appSecret);
  };

  const restartService = async () => {
    startAction('restart-service', '正在重启OpenClaw服务...');
    
    try {
      updateProgress(0, { status: 'running' });
      
      const result = await window.electronAPI.restartOpenClaw();
      
      if (result.success) {
        updateProgress(0, { status: 'success' });
        addLog('OpenClaw服务重启成功');
        notifySuccess('OpenClaw服务重启成功');
        setCurrentStep(7);
      } else {
        throw new Error(result.error || '重启失败');
      }
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      addLog(`重启失败: ${errorMsg}`);
      notifyError(`重启失败: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQqAction = async (action: string) => {
    switch (action) {
      case 'check-plugin':
        await checkPlugin();
        break;
      case 'install-plugin':
        await installPlugin();
        break;
      case 'open-console':
        await openConsole();
        break;
      case 'create-robot':
        await createRobot();
        break;
      case 'get-credentials':
        await getCredentials();
        break;
      case 'bind-channel':
        await bindChannel();
        break;
      case 'restart-service':
        await restartService();
        break;
      default:
        notifyError('未知操作');
    }
  };

  const ensurePluginInstalled = async () => {
    setIsProcessing(true);
    setInstallLogs([]);
    addLog('=== 开始一键配置 ===');
    addLog('正在检查QQ插件...');

    try {
      const result = await window.electronAPI.checkQqPlugin();
      console.log('检查插件结果:', result);

      if (result.installed) {
        setPluginInstalled(true);
        addLog('✅ QQ插件已安装，跳过安装步骤');
        setCurrentStep(2);
      } else {
        setPluginInstalled(false);
        addLog('❌ QQ插件未安装，开始安装...');

        const installResult = await window.electronAPI.installQqPlugin();
        if (installResult.success) {
          setPluginInstalled(true);
          addLog('✅ QQ插件安装成功');
          setCurrentStep(2);
        } else {
          addLog(`❌ 安装失败: ${installResult.error}`);
          notifyError(`安装失败: ${installResult.error}`);
          return false;
        }
      }
      return true;
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      addLog(`❌ 检查插件失败: ${errorMsg}`);
      notifyError(`检查插件失败: ${errorMsg}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const runAllSteps = async () => {
    const pluginReady = await ensurePluginInstalled();
    if (!pluginReady) {
      return;
    }
    await openConsole();
  };

  return {
    currentStep,
    setCurrentStep,
    isProcessing,
    pluginInstalled,
    installLogs,
    rpaProgress,
    qqConfig,
    setQqConfig,
    handleQqAction,
    runAllSteps,
  };
}
