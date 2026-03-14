import { useState, useCallback } from 'react';
import { useAppStore } from '../../../store';
import type { DownloadProgressEvent } from '../../../types';

export function useInstall(enableGitProxy: boolean = false) {
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
  const [downloadProgress, setDownloadProgress] = useState<{[key: string]: number}>({});

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
      // 检查 VC++ 运行库
      const vcredistResult = await window.electronAPI.checkVCRedist();
      setSystemStatus({ vcredist: { installed: vcredistResult.installed, message: vcredistResult.message } });
      addLog(`VC++运行库检测: ${vcredistResult.installed ? '已安装' : '未安装'}`);
      if (!vcredistResult.installed) {
        addLog('警告: 缺少微软 VC++ 运行库，Node.js 可能无法正常安装');
      }
      
      const nodeResult = await window.electronAPI.checkNode();
      setSystemStatus({ node: nodeResult });
      addLog(`Node.js检测: ${nodeResult.installed ? `v${nodeResult.version}` : '未安装'}${nodeResult.needUpdate ? ' (需要更新)' : ''}`);
      
      const npmResult = await window.electronAPI.checkNpm();
      setSystemStatus({ npm: npmResult });
      addLog(`npm检测: ${npmResult.installed ? `v${npmResult.version}` : '未安装'}${npmResult.needUpdate ? ' (需要更新)' : ''}`);
      
      const gitResult = await window.electronAPI.checkGit();
      setSystemStatus({ git: gitResult });
      addLog(`Git检测: ${gitResult.installed ? `v${gitResult.version}` : '未安装'}${gitResult.needUpdate ? ' (需要更新)' : ''}`);
      
      const openclawResult = await window.electronAPI.checkOpenClaw();
      setSystemStatus({ openclaw: openclawResult });
      addLog(`OpenClaw检测: ${openclawResult.installed ? `v${openclawResult.version}` : '未安装'}`);
      
      updateStepStatus('check-env', 'success', '检测完成');
      addLog('所有环境检测完成');
    } catch (error) {
      updateStepStatus('check-env', 'error', `检测失败: ${error}`);
      addLog(`环境检测失败: ${error}`);
    }
  }, [setSystemStatus, updateStepStatus, addLog]);

  const installVCRedist = useCallback(async () => {
    // 如果已经安装，跳过
    if (systemStatus.vcredist?.installed) {
      updateStepStatus('install-vcredist', 'success', '已安装，跳过');
      addLog('VC++运行库已安装，跳过');
      return true;
    }

    updateStepStatus('install-vcredist', 'running');
    addLog('开始下载并安装VC++运行库...');

    try {
      const downloadUrl = 'https://download.visualstudio.microsoft.com/download/pr/7ebf5fdb-36dc-4145-b0a0-90d3d5990a61/CC0FF0EB1DC3F5188AE6300FAEF32BF5BEEBA4BDD6E8E445A9184072096B713B/VC_redist.x64.exe';
      const tempPath = await window.electronAPI.getSystemInfo().then(info => info.tempPath);
      const installerPath = `${tempPath}\\VC_redist.x64.exe`;

      addLog('正在下载VC++运行库...');
      setDownloadProgress(prev => ({ ...prev, vcredist: 0 }));

      window.onDownloadProgress = (progress: DownloadProgressEvent) => {
        if (progress.url === downloadUrl) {
          setDownloadProgress(prev => ({ ...prev, vcredist: progress.progress }));
        }
      };

      const downloadResult = await window.electronAPI.downloadFileWithProgress(downloadUrl, installerPath);
      window.onDownloadProgress = undefined;
      setDownloadProgress(prev => ({ ...prev, vcredist: 100 }));

      if (!downloadResult.success) {
        throw new Error(downloadResult.error);
      }

      addLog('下载完成，开始安装VC++运行库...');
      
      // 使用静默安装参数，如果需要管理员权限会弹出UAC提示
      const installResult = await window.electronAPI.executeCommand(
        `"${installerPath}" /install /quiet /norestart`,
        { timeout: 300000 }
      );

      // 检查安装结果（退出码 0 表示成功，3010 表示成功但需要重启）
      const exitCode = installResult.stdout?.match(/exit code: (\d+)/)?.[1] || '0';
      if (!installResult.success && exitCode !== '0' && exitCode !== '3010') {
        throw new Error('VC++运行库安装程序返回错误');
      }

      // 重新检查VC++运行库
      const vcredistResult = await window.electronAPI.checkVCRedist();
      setSystemStatus({ vcredist: { installed: vcredistResult.installed, message: vcredistResult.message } });

      if (vcredistResult.installed) {
        updateStepStatus('install-vcredist', 'success', '安装完成');
        addLog('VC++运行库安装成功');
        return true;
      } else {
        throw new Error('VC++运行库安装后检测仍未通过，可能需要手动安装');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      updateStepStatus('install-vcredist', 'error', '安装失败，请手动安装');
      addLog(`VC++运行库安装失败: ${errorMsg}`);
      addLog('请访问 https://aka.ms/vs/17/release/vc_redist.x64.exe 手动下载安装');
      // 返回 false 中断后续安装
      return false;
    }
  }, [systemStatus.vcredist, setSystemStatus, updateStepStatus, addLog]);

  const installNode = useCallback(async () => {
    if (systemStatus.node.installed && !systemStatus.node.needUpdate) {
      updateStepStatus('install-node', 'success', '已安装，跳过');
      addLog(`Node.js已安装且版本符合要求: v${systemStatus.node.version}`);
      return true;
    }
    
    updateStepStatus('install-node', 'running');
    addLog('开始下载并安装Node.js...');
    
    try {
      const downloadUrl = 'https://cdn.npmmirror.com/binaries/node/v22.14.0/node-v22.14.0-x64.msi';
      const tempPath = await window.electronAPI.getSystemInfo().then(info => info.tempPath);
      const installerPath = `${tempPath}\\nodejs-installer.msi`;
      
      addLog('正在下载Node.js安装包...');
      setDownloadProgress(prev => ({ ...prev, node: 0 }));
      
      window.onDownloadProgress = (progress: DownloadProgressEvent) => {
        if (progress.url === downloadUrl) {
          setDownloadProgress(prev => ({ ...prev, node: progress.progress }));
        }
      };
      
      const downloadResult = await window.electronAPI.downloadFileWithProgress(downloadUrl, installerPath);
      window.onDownloadProgress = undefined;
      setDownloadProgress(prev => ({ ...prev, node: 100 }));
      
      if (!downloadResult.success) {
        throw new Error(downloadResult.error);
      }
      
      addLog('下载完成，开始安装Node.js...');
      const installResult = await window.electronAPI.executeCommand(
        `powershell.exe -Command "Start-Process msiexec -ArgumentList '/i', '${installerPath}', '/qn', '/norestart' -Verb RunAs -Wait"`,
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
  }, [systemStatus.node, addLog, updateStepStatus, setSystemStatus]);

  const installGit = useCallback(async () => {
    if (systemStatus.git.installed && !systemStatus.git.needUpdate) {
      updateStepStatus('install-git', 'success', '已安装，跳过');
      addLog(`Git已安装且版本符合要求: v${systemStatus.git.version}`);
      return true;
    }
    
    updateStepStatus('install-git', 'running');
    addLog('开始下载并安装Git...');
    
    try {
      // 动态获取最新版本的 Git 下载地址
      addLog('正在获取最新版本信息...');
      const gitInfo = await window.electronAPI.getGitDownloadUrl();
      
      if (!gitInfo.success || !gitInfo.downloadUrl) {
        throw new Error(gitInfo.error || '获取下载地址失败');
      }
      
      addLog(`获取到最新版本: v${gitInfo.version}`);
      
      const downloadUrl = gitInfo.downloadUrl;
      const tempPath = await window.electronAPI.getSystemInfo().then(info => info.tempPath);
      const installerPath = `${tempPath}\\git-installer.exe`;
      
      addLog('正在从南京大学镜像下载Git...');
      setDownloadProgress(prev => ({ ...prev, git: 0 }));
      
      window.onDownloadProgress = (progress: DownloadProgressEvent) => {
        if (progress.url === downloadUrl) {
          setDownloadProgress(prev => ({ ...prev, git: progress.progress }));
        }
      };
      
      const downloadResult = await window.electronAPI.downloadFileWithProgress(downloadUrl, installerPath);
      window.onDownloadProgress = undefined;
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
      
      if (enableGitProxy) {
        addLog('配置Git代理...');
        await window.electronAPI.configGitProxy();
      } else {
        addLog('跳过Git代理配置（未开启）');
      }
      
      // 检查Git是否安装成功
      const checkResult = await window.electronAPI.checkGit();
      
      if (checkResult.installed) {
        setSystemStatus({ git: checkResult });
        updateStepStatus('install-git', 'success', `已安装 v${checkResult.version}`);
        addLog(`Git安装成功: v${checkResult.version}`);
        
        // Git安装成功后重启应用以更新环境变量
        addLog('Git安装成功，正在重启应用以更新环境变量...');
        await window.electronAPI.restartApp();
        return true;
      } else {
        // 如果Git未检测到，提示用户重启应用
        addLog('Git已安装，但需要重启应用才能检测到');
        setSystemStatus({ git: { installed: false, needUpdate: true } });
        updateStepStatus('install-git', 'success', 'Node等环境已安装，但需要重启应用才能检测到，请重启应用');
        addLog('Git安装程序已运行完成');
        addLog('提示：请点击"重启应用"按钮，或关闭后重新打开应用以继续安装');
        // 显示重启提示，让用户选择
        if (window.confirm('Git已安装成功，但需要重启应用才能生效。是否立即重启应用并继续安装？')) {
          // 保存继续安装的标志
          await window.electronAPI.restartApp({ continueInstall: true, step: 'install-git' });
        }
        return false;
      }
    } catch (error) {
      updateStepStatus('install-git', 'error', `安装失败: ${error}`);
      addLog(`Git安装失败: ${error}`);
      addLog('提示：您可以点击"手动下载"按钮自行下载安装');
      return false;
    }
  }, [systemStatus.git, enableGitProxy, addLog, updateStepStatus, setSystemStatus]);

  const installOpenClaw = useCallback(async () => {
    updateStepStatus('install-openclaw', 'running');
    addLog('开始安装OpenClaw...');
    
    try {
      addLog('正在启动独立安装窗口...');
      addLog('请在弹出的PowerShell窗口中查看安装进度');
      
      const result = await window.electronAPI.installOpenClaw({ enableGitProxy });
      
      if (result.success) {
        if (result.needVerify) {
          // PowerShell窗口已关闭，需要验证安装结果
          addLog('PowerShell安装窗口已关闭，正在验证安装结果...');
          
          const checkResult = await window.electronAPI.checkOpenClaw();
          setSystemStatus({ openclaw: checkResult });
          
          if (checkResult.installed) {
            updateStepStatus('install-openclaw', 'success', '安装完成');
            addLog('OpenClaw安装成功');
            return true;
          } else {
            updateStepStatus('install-openclaw', 'error', '安装未完成，请重新安装');
            addLog('OpenClaw安装未完成，请检查PowerShell窗口中的错误信息并重新安装');
            return false;
          }
        } else {
          // 正常模式
          const checkResult = await window.electronAPI.checkOpenClaw();
          setSystemStatus({ openclaw: checkResult });
          
          updateStepStatus('install-openclaw', 'success', '安装完成');
          addLog('OpenClaw安装成功');
          return true;
        }
      }

      const errorText = result.error || '未知错误';
      updateStepStatus('install-openclaw', 'error', `安装失败: ${errorText}`);
      addLog(`OpenClaw安装失败: ${errorText}`);

      if (result.reasonType) {
        const reasonTextMap: Record<NonNullable<typeof result.reasonType>, string> = {
          network: '网络问题',
          permission: '权限问题',
          git: 'Git/GitHub 访问问题',
          env: '环境变量或命令缺失',
          unknown: '暂未识别',
        };
        addLog(`诊断结论: ${reasonTextMap[result.reasonType]}`);
      }

      if (result.diagnosis?.length) {
        result.diagnosis.forEach((item) => {
          addLog(`[诊断] ${item}`);
        });
      }

      if (result.stderr) {
        const firstLine = result.stderr.split('\n').find(line => line.trim());
        if (firstLine) {
          addLog(`[原始错误] ${firstLine}`);
        }
      }

      addLog('提示：您可以点击"手动安装"按钮查看安装文档');
      return false;
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      updateStepStatus('install-openclaw', 'error', `安装失败: ${errorText}`);
      addLog(`OpenClaw安装失败: ${errorText}`);
      addLog('提示：您可以点击"手动安装"按钮查看安装文档');
      return false;
    }
  }, [enableGitProxy, addLog, updateStepStatus, setSystemStatus]);

  const initConfig = useCallback(async () => {
    updateStepStatus('init-config', 'running');
    addLog('正在创建OpenClaw配置文件...');

    try {
      const result = await window.electronAPI.initOpenClawConfig();
      if (result.success) {
        updateStepStatus('init-config', 'success', '配置已创建');
        addLog('OpenClaw配置文件创建成功');
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      updateStepStatus('init-config', 'error', `创建失败: ${error}`);
      addLog(`配置文件创建失败: ${error}`);
      return false;
    }
  }, [addLog, updateStepStatus]);

  const installAndStartGateway = useCallback(async () => {
    updateStepStatus('start-gateway', 'running');
    addLog('正在安装并启动OpenClaw网关服务...');

    try {
      // 先尝试启动网关（如果服务未安装会自动安装）
      const result = await window.electronAPI.startOpenClawGateway();
      if (result.success) {
        updateStepStatus('start-gateway', 'success', result.message || '网关已启动');
        addLog(`网关服务${result.message || '启动成功'}`);
        return true;
      } else {
        throw new Error(result.error || '启动失败');
      }
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      updateStepStatus('start-gateway', 'error', `启动失败: ${errorText}`);
      addLog(`网关服务启动失败: ${errorText}`);
      return false;
    }
  }, [addLog, updateStepStatus]);

  const startInstall = useCallback(async () => {
    setIsInstalling(true);
    clearLogs();
    addLog('开始一键安装...');
    
    try {
      // 1. 检测环境
      await checkEnvironment();
      
      // 2. 安装VC++运行库
      setCurrentStepIndex(1);
      const vcredistSuccess = await installVCRedist();
      if (!vcredistSuccess) {
        addLog('VC++运行库安装失败，继续尝试安装Node.js...');
      }
      
      // 3. 安装Node.js
      setCurrentStepIndex(2);
      const nodeSuccess = await installNode();
      if (!nodeSuccess) {
        addLog('Node.js安装失败，安装流程中止');
        setIsInstalling(false);
        return;
      }
      
      // 4. 安装Git
      setCurrentStepIndex(3);
      const gitSuccess = await installGit();
      if (!gitSuccess) {
        addLog('Git安装失败，安装流程中止');
        setIsInstalling(false);
        return;
      }
      
      // 5. 安装OpenClaw
      setCurrentStepIndex(4);
      const openclawSuccess = await installOpenClaw();
      if (!openclawSuccess) {
        addLog('OpenClaw安装失败，安装流程中止');
        setIsInstalling(false);
        return;
      }
      
      // 6. 创建配置文件
      setCurrentStepIndex(5);
      const configSuccess = await initConfig();
      if (!configSuccess) {
        addLog('配置文件创建失败，但OpenClaw已安装成功');
      }
      
      // 7. 安装并启动网关
      setCurrentStepIndex(6);
      const gatewaySuccess = await installAndStartGateway();
      if (!gatewaySuccess) {
        addLog('网关启动失败，您可以稍后手动启动');
      }
      
      addLog('');
      addLog('========================================');
      addLog('安装完成！');
      addLog('========================================');
      addLog('');
      addLog('您现在可以：');
      addLog('1. 在"通道配置"页面配置QQ、飞书等消息通道');
      addLog('2. 在"AI配置"页面配置大模型API');
      addLog('');
      addLog('提示：首次使用建议查看"使用指南"页面');
      
    } catch (error) {
      addLog(`安装过程出错: ${error}`);
    } finally {
      setIsInstalling(false);
      setCurrentStepIndex(0);
    }
  }, [checkEnvironment, installVCRedist, installNode, installGit, installOpenClaw, initConfig, installAndStartGateway, clearLogs, addLog]);

  const resetAllStatus = useCallback(() => {
    setSystemStatus({
      node: { installed: false, needUpdate: true },
      npm: { installed: false, needUpdate: true },
      git: { installed: false, needUpdate: true },
      openclaw: { installed: false },
      vcredist: { installed: false },
    });
    clearLogs();
    addLog('状态已重置');
  }, [setSystemStatus, clearLogs, addLog]);

  const downloadNodeManually = useCallback(() => {
    window.electronAPI.openExternal('https://nodejs.org/');
  }, []);

  const downloadGitManually = useCallback(() => {
    window.electronAPI.openExternal('https://mirror.nju.edu.cn/github-release/git-for-windows/git/');
  }, []);

  const installOpenClawManually = useCallback(() => {
    window.electronAPI.openExternal('https://openclaw.ai/docs/installation');
  }, []);

  return {
    isInstalling,
    currentStepIndex,
    downloadProgress,
    systemStatus,
    installSteps,
    isAllInstalled,
    checkEnvironment,
    startInstall,
    resetAllStatus,
    initConfigFile: initConfig,
    downloadNodeManually,
    downloadGitManually,
    installOpenClawManually,
  };
}
