import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '../../../store';

export function useInstall(isDebugMode: boolean = false) {
  const {
    systemStatus,
    setSystemStatus,
    installSteps,
    updateStepStatus,
    addLog,
    clearLogs
  } = useAppStore();

  const [isInstalling, setIsInstalling] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCheckingUpgrade, setIsCheckingUpgrade] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{[key: string]: number}>({});
  const [isInitConfig, setIsInitConfig] = useState(false);
  const logsRef = useRef<HTMLDivElement>(null);

  const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const isAllInstalled = useCallback(() => {
    return systemStatus.node.installed && 
           !systemStatus.node.needUpdate &&
           systemStatus.npm.installed &&
           systemStatus.git.installed && 
           !systemStatus.git.needUpdate &&
           systemStatus.openclaw.installed;
  }, [systemStatus]);

  const checkEnvironment = useCallback(async () => {
    addLog('开始检测环境...');
    updateStepStatus('check-env', 'running');
    
    try {
      const nodeResult = await window.electronAPI.checkNode();
      setSystemStatus({ node: nodeResult });
      addLog(`Node.js检测: ${nodeResult.installed ? `v${nodeResult.version}` : '未安装'}${nodeResult.needUpdate ? ' (需要更新)' : ''}`);
      
      const npmResult = await window.electronAPI.checkNpm();
      setSystemStatus({ npm: npmResult });
      addLog(`npm检测: ${npmResult.installed ? `v${npmResult.version}` : '未安装'}`);
      
      const gitResult = await window.electronAPI.checkGit();
      setSystemStatus({ git: gitResult });
      addLog(`Git检测: ${gitResult.installed ? `v${gitResult.version}` : '未安装'}${gitResult.needUpdate ? ' (需要更新)' : ''}`);
      
      const openclawResult = await window.electronAPI.checkOpenClaw();
      setSystemStatus({ openclaw: openclawResult });
      addLog(`OpenClaw检测: ${openclawResult.installed ? `已安装 ${openclawResult.version}` : '未安装'}`);
      
      updateStepStatus('check-env', 'success', '环境检测完成');
      
      if (isAllInstalled()) {
        installSteps.forEach(step => {
          if (step.id !== 'check-env') {
            updateStepStatus(step.id, 'success', '已安装，跳过');
          }
        });
        addLog('✅ 所有环境已安装且版本符合要求');
      }
      
      return true;
    } catch (error) {
      updateStepStatus('check-env', 'error', `检测失败: ${error}`);
      addLog(`环境检测失败: ${error}`);
      return false;
    }
  }, [addLog, updateStepStatus, setSystemStatus, installSteps, isAllInstalled]);

  const installNode = useCallback(async () => {
    if (systemStatus.node.installed && !systemStatus.node.needUpdate) {
      addLog('Node.js已安装且版本符合要求，跳过安装');
      updateStepStatus('install-node', 'success', '已安装，跳过');
      return true;
    }
    
    updateStepStatus('install-node', 'running');
    addLog('开始下载并安装Node.js...');
    
    if (isDebugMode) {
      addLog('[模拟模式] 模拟下载Node.js...');
      await mockDelay(2000);
      addLog('[模拟模式] 模拟安装Node.js...');
      await mockDelay(2000);
      setSystemStatus({ node: { installed: true, version: '22.11.0', needUpdate: false } });
      updateStepStatus('install-node', 'success', '[模拟] 已安装 v22.11.0');
      addLog('[模拟模式] Node.js安装成功: v22.11.0');
      return true;
    }
    
    try {
      const downloadUrl = 'https://cdn.npmmirror.com/binaries/node/v24.14.0/node-v24.14.0-x64.msi';
      const tempPath = await window.electronAPI.getSystemInfo().then(info => info.tempPath);
      const installerPath = `${tempPath}\\nodejs-installer.msi`;
      
      addLog('正在下载Node.js安装包...');
      setDownloadProgress(prev => ({ ...prev, node: 0 }));
      
      (window as any).onDownloadProgress = (progress: any) => {
        if (progress.url === downloadUrl) {
          setDownloadProgress(prev => ({ ...prev, node: progress.progress }));
        }
      };
      
      const downloadResult = await window.electronAPI.downloadFileWithProgress(downloadUrl, installerPath);
      setDownloadProgress(prev => ({ ...prev, node: 100 }));
      
      if (!downloadResult.success) {
        throw new Error(downloadResult.error);
      }
      
      addLog('下载完成，开始安装Node.js...');
      const installResult = await window.electronAPI.executeCommand(
        `powershell.exe -Command "Start-Process msiexec -ArgumentList '/i', '\"${installerPath}\"', '/qn', '/norestart' -Verb RunAs -Wait"`,
        { timeout: 300000 }
      );
      
      if (!installResult.success) {
        throw new Error(installResult.error);
      }
      
      const checkResult = await window.electronAPI.checkNode();
      setSystemStatus({ node: checkResult });
      
      updateStepStatus('install-node', 'success', `已安装 v${checkResult.version}`);
      addLog(`Node.js安装成功: v${checkResult.version}`);
      return true;
    } catch (error) {
      updateStepStatus('install-node', 'error', `安装失败: ${error}`);
      addLog(`Node.js安装失败: ${error}`);
      addLog('提示：您可以点击"手动下载"按钮自行下载安装');
      return false;
    }
  }, [systemStatus.node, isDebugMode, addLog, updateStepStatus, setSystemStatus]);

  const configNpm = useCallback(async () => {
    updateStepStatus('config-npm', 'running');
    addLog('正在配置npm国内镜像源...');
    
    try {
      const result = await window.electronAPI.setNpmRegistry();
      if (result.success) {
        updateStepStatus('config-npm', 'success', `已设置为: ${result.registry}`);
        addLog(`npm镜像源配置成功: ${result.registry}`);
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      updateStepStatus('config-npm', 'error', `配置失败: ${error}`);
      addLog(`npm配置失败: ${error}`);
      return false;
    }
  }, [addLog, updateStepStatus]);

  const installGit = useCallback(async () => {
    if (systemStatus.git.installed && !systemStatus.git.needUpdate) {
      addLog('Git已安装且版本符合要求，跳过安装');
      updateStepStatus('install-git', 'success', '已安装，跳过');
      return true;
    }
    
    updateStepStatus('install-git', 'running');
    addLog('开始下载并安装Git...');
    
    if (isDebugMode) {
      addLog('[模拟模式] 模拟下载Git...');
      await mockDelay(2000);
      addLog('[模拟模式] 模拟安装Git...');
      await mockDelay(2000);
      setSystemStatus({ git: { installed: true, version: '2.47.1', needUpdate: false } });
      updateStepStatus('install-git', 'success', '[模拟] 已安装 v2.47.1');
      addLog('[模拟模式] Git安装成功: v2.47.1');
      return true;
    }
    
    try {
      const downloadUrl = 'https://mirror.nju.edu.cn/github-release/git-for-windows/git/Git%20for%20Windows%20v2.53.0.windows.1/Git-2.53.0-64-bit.exe';
      const tempPath = await window.electronAPI.getSystemInfo().then(info => info.tempPath);
      const installerPath = `${tempPath}\\git-installer.exe`;
      
      addLog('正在从南京大学镜像下载Git...');
      setDownloadProgress(prev => ({ ...prev, git: 0 }));
      
      (window as any).onDownloadProgress = (progress: any) => {
        if (progress.url === downloadUrl) {
          setDownloadProgress(prev => ({ ...prev, git: progress.progress }));
        }
      };
      
      const downloadResult = await window.electronAPI.downloadFileWithProgress(downloadUrl, installerPath);
      setDownloadProgress(prev => ({ ...prev, git: 100 }));
      
      if (!downloadResult.success) {
        throw new Error(downloadResult.error);
      }
      
      addLog('下载完成，开始安装Git...');
      const installResult = await window.electronAPI.executeCommand(
        `"${installerPath}" /VERYSILENT /NORESTART`,
        { timeout: 300000 }
      );
      
      if (!installResult.success) {
        throw new Error(installResult.error);
      }
      
      addLog('配置Git代理...');
      await window.electronAPI.configGitProxy();
      
      const checkResult = await window.electronAPI.checkGit();
      setSystemStatus({ git: checkResult });
      
      updateStepStatus('install-git', 'success', `已安装 v${checkResult.version}`);
      addLog(`Git安装成功: v${checkResult.version}`);
      return true;
    } catch (error) {
      updateStepStatus('install-git', 'error', `安装失败: ${error}`);
      addLog(`Git安装失败: ${error}`);
      addLog('提示：您可以点击"手动下载"按钮自行下载安装');
      return false;
    }
  }, [systemStatus.git, isDebugMode, addLog, updateStepStatus, setSystemStatus]);

  const installOpenClaw = useCallback(async () => {
    updateStepStatus('install-openclaw', 'running');
    addLog('开始安装OpenClaw...');
    
    if (isDebugMode) {
      addLog('[模拟模式] 模拟安装OpenClaw...');
      await mockDelay(2000);
      setSystemStatus({ openclaw: { installed: true, version: '1.0.0' } });
      updateStepStatus('install-openclaw', 'success', '[模拟] 安装完成');
      addLog('[模拟模式] OpenClaw安装成功');
      return true;
    }
    
    try {
      const result = await window.electronAPI.installOpenClaw();
      if (result.success) {
        const checkResult = await window.electronAPI.checkOpenClaw();
        setSystemStatus({ openclaw: checkResult });
        
        updateStepStatus('install-openclaw', 'success', '安装完成');
        addLog('OpenClaw安装成功');
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      updateStepStatus('install-openclaw', 'error', `安装失败: ${error}`);
      addLog(`OpenClaw安装失败: ${error}`);
      addLog('提示：您可以点击"手动安装"按钮查看安装文档');
      return false;
    }
  }, [isDebugMode, addLog, updateStepStatus, setSystemStatus]);

  const initConfig = useCallback(async () => {
    updateStepStatus('init-config', 'running');
    addLog('正在创建OpenClaw配置文件...');
    
    try {
      const config = {
        agents: {
          list: [
            {
              id: 'main',
              provider: 'anthropic',
              model: 'claude-3-7-sonnet-20250219'
            }
          ],
          defaults: {
            provider: 'anthropic',
            model: 'claude-3-7-sonnet-20250219'
          }
        }
      };
      
      const result = await window.electronAPI.saveOpenClawConfig(config);
      if (result.success) {
        updateStepStatus('init-config', 'success', '配置已创建');
        addLog('OpenClaw配置文件创建完成');
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      updateStepStatus('init-config', 'error', `配置创建失败: ${error}`);
      addLog(`OpenClaw配置创建失败: ${error}`);
      return false;
    }
  }, [addLog, updateStepStatus]);

  const startGateway = useCallback(async () => {
    updateStepStatus('start-gateway', 'running');
    addLog('正在启动OpenClaw网关...');
    
    try {
      const result = await window.electronAPI.startOpenClawGateway();
      if (result.success) {
        let portCheckCount = 0;
        const maxCheckCount = 30;
        
        while (portCheckCount < maxCheckCount) {
          addLog(`检测网关端口 18789... (${portCheckCount + 1}/${maxCheckCount})`);
          const portResult = await window.electronAPI.checkPort(18789);
          
          if (portResult.open) {
            updateStepStatus('start-gateway', 'success', '网关已启动');
            addLog('OpenClaw网关启动成功，端口 18789 已开放');
            return true;
          }
          
          portCheckCount++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        throw new Error('网关端口检测超时，请手动检查');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      updateStepStatus('start-gateway', 'error', `启动失败: ${error}`);
      addLog(`OpenClaw网关启动失败: ${error}`);
      return false;
    }
  }, [addLog, updateStepStatus]);

  const startInstall = useCallback(async () => {
    setIsInstalling(true);
    setCurrentStepIndex(0);
    
    installSteps.forEach(step => {
      updateStepStatus(step.id, 'pending');
    });
    
    if (!(await checkEnvironment())) {
      setIsInstalling(false);
      return;
    }
    setCurrentStepIndex(1);
    
    if (!(await installNode())) {
      setIsInstalling(false);
      return;
    }
    setCurrentStepIndex(2);
    
    if (!(await configNpm())) {
      setIsInstalling(false);
      return;
    }
    setCurrentStepIndex(3);
    
    if (!(await installGit())) {
      setIsInstalling(false);
      return;
    }
    setCurrentStepIndex(4);
    
    if (!(await installOpenClaw())) {
      setIsInstalling(false);
      return;
    }
    setCurrentStepIndex(5);
    
    if (!(await initConfig())) {
      setIsInstalling(false);
      return;
    }
    setCurrentStepIndex(6);
    
    if (!(await startGateway())) {
      setIsInstalling(false);
      return;
    }
    
    setIsInstalling(false);
    addLog('=== 安装流程全部完成 ===');
  }, [installSteps, checkEnvironment, installNode, configNpm, installGit, installOpenClaw, initConfig, startGateway, addLog, updateStepStatus]);

  const checkUpgrade = useCallback(async () => {
    setIsCheckingUpgrade(true);
    addLog('开始检测可升级组件...');
    
    try {
      if (systemStatus.node.installed && systemStatus.node.needUpdate) {
        addLog(`Node.js需要更新: 当前 v${systemStatus.node.version}`);
        await installNode();
      }
      
      if (systemStatus.git.installed && systemStatus.git.needUpdate) {
        addLog(`Git需要更新: 当前 v${systemStatus.git.version}`);
        await installGit();
      }
      
      if (systemStatus.openclaw.installed) {
        addLog('检查OpenClaw更新...');
        await installOpenClaw();
      }
      
      addLog('✅ 升级检测完成');
    } catch (error) {
      addLog(`升级检测失败: ${error}`);
    } finally {
      setIsCheckingUpgrade(false);
    }
  }, [systemStatus, installNode, installGit, installOpenClaw, addLog]);

  const resetAllStatus = useCallback(() => {
    setSystemStatus({
      node: { installed: false, needUpdate: false },
      npm: { installed: false },
      git: { installed: false, needUpdate: false },
      openclaw: { installed: false },
    });
    installSteps.forEach(step => {
      updateStepStatus(step.id, 'pending');
    });
    clearLogs();
    addLog('状态已重置，可以重新测试安装流程');
  }, [setSystemStatus, installSteps, updateStepStatus, clearLogs, addLog]);

  const initConfigFile = useCallback(async () => {
    setIsInitConfig(true);
    addLog('正在初始化配置文件...');
    
    try {
      const config = {
        agents: {
          list: [
            {
              id: 'main',
              provider: 'anthropic',
              model: 'claude-3-7-sonnet-20250219'
            }
          ],
          defaults: {
            provider: 'anthropic',
            model: 'claude-3-7-sonnet-20250219'
          }
        }
      };
      
      const result = await window.electronAPI.saveOpenClawConfig(config);
      if (result.success) {
        addLog(`配置文件初始化成功: ${result.path}`);
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      addLog(`配置文件初始化失败: ${error}`);
      return false;
    } finally {
      setIsInitConfig(false);
    }
  }, [addLog]);

  const downloadNodeManually = useCallback(() => {
    window.electronAPI.openExternal('https://cdn.npmmirror.com/binaries/node/v24.14.0/node-v24.14.0-x64.msi');
    addLog('已打开Node.js下载页面，请手动下载安装');
  }, [addLog]);

  const downloadGitManually = useCallback(() => {
    window.electronAPI.openExternal('https://git-scm.com/download/win');
    addLog('已打开Git下载页面，请手动下载安装');
  }, [addLog]);

  const installOpenClawManually = useCallback(() => {
    window.electronAPI.openExternal('https://www.npmjs.com/package/openclaw');
    addLog('已打开OpenClaw npm页面，请按文档手动安装');
  }, [addLog]);

  return {
    isInstalling,
    currentStepIndex,
    isCheckingUpgrade,
    downloadProgress,
    isInitConfig,
    logsRef,
    systemStatus,
    installSteps,
    isAllInstalled,
    checkEnvironment,
    startInstall,
    checkUpgrade,
    resetAllStatus,
    initConfigFile,
    downloadNodeManually,
    downloadGitManually,
    installOpenClawManually,
  };
}
