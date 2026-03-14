import { useState, useCallback, useEffect, useRef } from 'react';
import { App } from 'antd';
import { useAppStore } from '../../../store';
import {
  getQqRpaSteps,
  updateAllQqProgressItems,
  updateQqProgressItems,
  type QqAction,
  type QqProgressItem
} from './qqConfigProgress';

export type ConfigMode = 'create' | 'read';

export function useQqConfig() {
  const { qqConfig, setQqConfig, addLog: storeAddLog } = useAppStore();
  const { message: messageApi } = App.useApp();

  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pluginInstalled, setPluginInstalled] = useState(false);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [rpaProgress, setRpaProgress] = useState<QqProgressItem[]>([]);
  const [openclawInstalled, setOpenclawInstalled] = useState<boolean | null>(null);
  const [isCheckingOpenclaw, setIsCheckingOpenclaw] = useState(true);
  const [configMode, setConfigMode] = useState<ConfigMode>('create');
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRestartingRef = useRef(false);
  const hasRunRestartRef = useRef(false); // 防止重复重启

  // 清理定时器
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

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

  // 检查 OpenClaw 是否安装
  useEffect(() => {
    const checkOpenClaw = async () => {
      setIsCheckingOpenclaw(true);
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
        setIsCheckingOpenclaw(false);
      }
    };
    checkOpenClaw();
  }, [notifyError]);

  // 配置模式切换时重置步骤
  useEffect(() => {
    setCurrentStep(0);
    setRpaProgress([]);
  }, [configMode]);

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
        updateProgress(0, { status: 'error', message: result.error || '插件未安装' });
        addLog(result.error || 'QQ插件未安装，需要先安装插件');
        if (result.output) {
          addLog(`插件列表: ${result.output}`);
        }
        notifyError(result.error || 'QQ插件未安装，请先安装插件');
        addLog('>>> 准备跳转到第1步（安装插件）');
        setCurrentStep(1);
        addLog('>>> 已设置当前步骤为1');
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
        addLog('请在打开的页面中扫码登录');
        addLog('系统将在后台自动检测登录状态（每5秒检查一次，最多2分钟）');
        notifySuccess('请在打开的页面中扫码登录，系统将自动检测');

        // 后台轮询检查登录状态
        addLog('开始自动检测登录状态...');
        const maxAttempts = 24; // 24次 * 5秒 = 120秒 = 2分钟
        let attempts = 0;

        // 清理之前的定时器
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }

        checkIntervalRef.current = setInterval(async () => {
          attempts++;
          addLog(`第 ${attempts}/${maxAttempts} 次检查登录状态...`);

          try {
            const checkResult = await window.electronAPI.qqCheckLogin();
            console.log(`[openConsole] 第 ${attempts} 次登录状态检查:`, checkResult);

            if (checkResult.loggedIn) {
              // 检测到已登录，停止轮询
              if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
                checkIntervalRef.current = null;
              }
              addLog('✅ 检测到已登录，自动进入下一步...');
              notifySuccess('检测到已登录');
              
              // 根据配置模式决定下一步
              if (configMode === 'create') {
                setCurrentStep(3);
                await createRobot();
              } else {
                // 读取配置模式，跳过创建机器人，直接获取凭证
                setCurrentStep(3);
                await getCredentials();
              }
              return;
            }

            // 检查是否达到最大次数
            if (attempts >= maxAttempts) {
              if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
                checkIntervalRef.current = null;
              }
              addLog('⏰ 2分钟内未检测到登录，请扫码登录后手动点击"已登录，继续"');
              notifyError('2分钟内未检测到登录，请手动点击"已登录，继续"');
              setIsProcessing(false);
            }
          } catch (error) {
            console.error(`[openConsole] 第 ${attempts} 次检查出错:`, error);
            // 出错继续轮询，直到达到最大次数
            if (attempts >= maxAttempts) {
              if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
                checkIntervalRef.current = null;
              }
              addLog('⏰ 检查超时，请扫码登录后手动点击"已登录，继续"');
              notifyError('检查超时，请手动点击"已登录，继续"');
              setIsProcessing(false);
            }
          }
        }, 5000); // 每5秒检查一次

      } else {
        console.log('[openConsole] 页面打开失败:', result.error);
        throw new Error(result.error || '打开失败');
      }

    } catch (error) {
      const errorMsg = getErrorMessage(error);
      addLog(`打开页面失败: ${errorMsg}`);
      notifyError('打开页面失败');
      setIsProcessing(false);
    }
  };

  const checkLoginAndContinue = async () => {
    startAction('check-login', '正在检查登录状态...');

    try {
      updateProgress(0, { status: 'running' });
      addLog('正在检测登录状态...');

      const checkResult = await window.electronAPI.qqCheckLogin();
      console.log('[checkLoginAndContinue] 登录状态检查结果:', checkResult);

      const isLoggedIn = checkResult.loggedIn || false;

      if (isLoggedIn) {
        updateProgress(0, { status: 'success', message: '已登录' });
        addLog('检测到已登录');
        notifySuccess('检测到已登录');
        
        // 根据配置模式决定下一步
        if (configMode === 'create') {
          setCurrentStep(3);
          await createRobot();
        } else {
          // 读取配置模式，跳过创建机器人，直接获取凭证
          setCurrentStep(3);
          await getCredentials();
        }
      } else {
        updateProgress(0, { status: 'error', message: '未登录' });
        addLog('未检测到登录，请先扫码登录');
        notifyError('未检测到登录，请先扫码登录');
      }
    } catch (error) {
      console.error('[checkLoginAndContinue] 检查登录状态出错:', error);
      updateProgress(0, { status: 'error', message: '检查失败' });
      addLog('检查登录状态出错，请确保已扫码登录');
      notifyError('检查登录状态失败');
    } finally {
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
      
      // 显示调试日志
      if (result.logs && Array.isArray(result.logs)) {
        addLog('=== 调试日志 ===');
        result.logs.forEach((log: string) => addLog(log));
        addLog('=== 调试日志结束 ===');
      }

      if (result.success && result.data) {
        const { appId, appSecret } = result.data;
        setQqConfig({
          appId,
          appSecret
        });
        updateProgress([0, 1], { status: 'success' });
        addLog(`获取凭证成功: AppID=${appId}`);
        notifySuccess('获取凭证成功');
        
        // 根据配置模式设置下一步
        if (configMode === 'create') {
          setCurrentStep(5);
        } else {
          setCurrentStep(4);
        }
        
        // 等待3秒后自动继续执行绑定机器人
        addLog('等待3秒后自动继续：绑定机器人...');
        await wait(3000);
        // 直接传入获取到的凭证，避免状态异步问题
        await bindChannelWithCredentials(appId, appSecret);
      } else if (result.needManualInput) {
        // 需要手动输入AppSecret
        updateProgress(0, { status: 'error', message: '需要手动输入AppSecret' });
        addLog('AppSecret需要手动获取，请在浏览器中查看并手动输入');
        addLog('获取AppID成功，请在下方输入AppSecret');
        notifyError('AppSecret需要手动获取');
        
        // 设置AppID，等待用户手动输入AppSecret
        if (result.data?.appId) {
          setQqConfig({
            appId: result.data.appId,
            appSecret: ''
          });
          addLog(`AppID: ${result.data.appId}`);
        }
        
        // 跳转到手动输入步骤
        if (configMode === 'create') {
          setCurrentStep(5);
        } else {
          setCurrentStep(4);
        }
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
      
      // 检查是否已存在相同 appId 的 qqbot 配置
      addLog(`检查是否已存在相同appId(${appId})的qqbot配置...`);
      const checkResult = await window.electronAPI.checkQqChannelExists(appId);
      
      if (checkResult.exists) {
        addLog(`发现相同appId的qqbot配置，准备删除...`);
        const deleteResult = await window.electronAPI.deleteQqChannel();
        if (deleteResult.success) {
          addLog('已删除现有qqbot配置');
        } else {
          addLog(`删除配置失败: ${deleteResult.error}`);
        }
      } else {
        addLog('未找到相同appId的qqbot配置');
      }
      
      const result = await window.electronAPI.configQqChannel(appId, appSecret);
      
      if (result.success) {
        updateProgress(0, { status: 'success' });
        addLog('QQ机器人绑定成功');
        notifySuccess('QQ机器人绑定成功');
        
        // 根据配置模式设置下一步
        if (configMode === 'create') {
          setCurrentStep(6);
        } else {
          setCurrentStep(5);
        }
        
        // 等待3秒后自动继续执行重启服务
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
    if (isRestartingRef.current) {
      addLog('⚠️ 服务正在重启中，请勿重复操作');
      return;
    }
    
    if (hasRunRestartRef.current) {
      addLog('⚠️ 服务已经重启过，跳过重复重启');
      return;
    }
    
    isRestartingRef.current = true;
    hasRunRestartRef.current = true;
    
    startAction('restart-service', '正在重启OpenClaw服务...');
    
    try {
      updateProgress(0, { status: 'running' });
      
      const result = await window.electronAPI.restartOpenClaw();
      
      if (result.success) {
        updateProgress(0, { status: 'success' });
        addLog('OpenClaw服务重启成功');
        notifySuccess('OpenClaw服务重启成功');
        
        // 根据配置模式设置完成步骤
        if (configMode === 'create') {
          setCurrentStep(7);
        } else {
          setCurrentStep(6);
        }
      } else {
        throw new Error(result.error || '重启失败');
      }
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error);
      addLog(`重启失败: ${errorMsg}`);
      notifyError(`重启失败: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
      isRestartingRef.current = false;
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
      case 'check-login':
        await checkLoginAndContinue();
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
          addLog('请手动点击"安装插件"按钮重试，或修复配置后重试');
          setCurrentStep(1); // 跳转到安装插件步骤，让用户手动处理
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

  // 一键创建机器人（完整流程）
  const runAllSteps = async () => {
    // 重置重启状态，允许重新执行
    hasRunRestartRef.current = false;
    const pluginReady = await ensurePluginInstalled();
    if (!pluginReady) {
      return;
    }
    await openConsole();
  };

  // 一键读取配置（跳过创建机器人）
  const runReadConfigSteps = async () => {
    // 重置重启状态，允许重新执行
    hasRunRestartRef.current = false;
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
    runReadConfigSteps,
    openclawInstalled,
    isCheckingOpenclaw,
    configMode,
    setConfigMode,
  };
}
