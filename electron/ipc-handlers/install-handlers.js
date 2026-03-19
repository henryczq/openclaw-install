// 安装和卸载相关 IPC 处理程序
import { exec, execSync, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import {
  startOpenClawGateway,
  stopOpenClawGateway,
  restartOpenClawGateway,
  checkGatewayStatus
} from '../utils/openclaw-gateway-service.js';
import {
  uninstallOpenClaw as uninstallOpenClawCommand
} from '../utils/openclaw-commands.js';

const execAsync = promisify(exec);
const OPENCLAW_REPO_URL = 'https://github.com/openclaw/openclaw.git';

function normalizeCommandOutput(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
    .trim();
}

function getCommandErrorText(error) {
  return [
    normalizeCommandOutput(error?.message),
    normalizeCommandOutput(error?.stderr),
    normalizeCommandOutput(error?.stdout),
  ].filter(Boolean).join('\n');
}

async function execForDiagnostics(command, options = {}) {
  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
      ...options,
    });
    return { success: true, output: normalizeCommandOutput(stdout || stderr) };
  } catch (error) {
    return { success: false, error: getCommandErrorText(error) };
  }
}

async function collectInstallDiagnostics() {
  const results = [];
  
  const nodeCheck = await execForDiagnostics('node --version');
  results.push(`Node.js: ${nodeCheck.success ? nodeCheck.output : '未找到'}`);
  
  const npmCheck = await execForDiagnostics('npm --version');
  results.push(`npm: ${npmCheck.success ? npmCheck.output : '未找到'}`);
  
  const gitCheck = await execForDiagnostics('git --version');
  results.push(`Git: ${gitCheck.success ? gitCheck.output : '未找到'}`);
  
  const openclawCheck = await execForDiagnostics('openclaw --version');
  results.push(`OpenClaw: ${openclawCheck.success ? openclawCheck.output : '未找到'}`);
  
  const pathCheck = await execForDiagnostics('echo %PATH%', { shell: 'cmd.exe' });
  results.push(`PATH包含Node: ${pathCheck.output?.toLowerCase().includes('nodejs') ? '是' : '否'}`);
  
  return results;
}

function classifyInstallFailure(errorText, diagnosis) {
  const text = errorText.toLowerCase();
  
  if (text.includes('code 128') || text.includes('git') || text.includes('github') || text.includes('ssh') || text.includes('clone')) {
    return { reasonType: 'git', error: `Git/GitHub 访问问题: ${errorText}` };
  }
  
  if (text.includes('permission') || text.includes('access') || text.includes('denied') || text.includes('eacces') || text.includes('权限')) {
    return { reasonType: 'permission', error: `权限问题: ${errorText}` };
  }
  
  if (text.includes('network') || text.includes('timeout') || text.includes('connect') || text.includes('socket') || text.includes('etimedout') || text.includes('enotfound')) {
    return { reasonType: 'network', error: `网络问题: ${errorText}` };
  }
  
  if (text.includes('npm') && (text.includes('not found') || text.includes('not recognized') || text.includes('command') || text.includes('��'))) {
    return { reasonType: 'env', error: `环境变量或命令缺失: ${errorText}` };
  }
  
  return { reasonType: 'unknown', error: errorText };
}

async function detectOpenClawResidueItems() {
  const homeDir = process.env.USERPROFILE || process.env.HOME || app.getPath('home');
  const appDataDir = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
  const candidates = [
    {
      key: 'appdata-openclaw-cmd',
      label: 'npm 全局命令',
      path: path.join(appDataDir, 'npm', 'openclaw.cmd'),
      kind: 'file',
    },
    {
      key: 'appdata-openclaw-ps1',
      label: 'npm PowerShell 启动器',
      path: path.join(appDataDir, 'npm', 'openclaw.ps1'),
      kind: 'file',
    },
    {
      key: 'appdata-openclaw-shim',
      label: 'npm 启动脚本',
      path: path.join(appDataDir, 'npm', 'openclaw'),
      kind: 'file',
    },
    {
      key: 'local-bin-openclaw-cmd',
      label: '本地 wrapper 命令',
      path: path.join(homeDir, '.local', 'bin', 'openclaw.cmd'),
      kind: 'file',
    },
    {
      key: 'local-bin-openclaw-shim',
      label: '本地 wrapper 脚本',
      path: path.join(homeDir, '.local', 'bin', 'openclaw'),
      kind: 'file',
    },
    {
      key: 'user-openclaw-repo',
      label: '用户目录源码副本',
      path: path.join(homeDir, 'openclaw'),
      kind: 'directory',
    },
    {
      key: 'user-openclaw-config',
      label: '用户配置目录',
      path: path.join(homeDir, '.openclaw'),
      kind: 'directory',
    },
  ];

  const npmRootResult = await execForDiagnostics('npm root -g');
  if (npmRootResult.success && npmRootResult.output) {
    const npmRootPath = npmRootResult.output.split('\n').pop()?.trim();
    if (npmRootPath) {
      candidates.push({
        key: 'npm-global-openclaw-package',
        label: 'npm 全局包目录',
        path: path.join(npmRootPath, 'openclaw'),
        kind: 'directory',
      });
    }
  }

  const npmPrefixResult = await execForDiagnostics('npm config get prefix');
  if (npmPrefixResult.success && npmPrefixResult.output) {
    const npmPrefixPath = npmPrefixResult.output.split('\n').pop()?.trim();
    if (npmPrefixPath) {
      candidates.push(
        {
          key: 'npm-prefix-openclaw-cmd',
          label: 'npm prefix 命令',
          path: path.join(npmPrefixPath, 'openclaw.cmd'),
          kind: 'file',
        },
        {
          key: 'npm-prefix-openclaw-ps1',
          label: 'npm prefix PowerShell 启动器',
          path: path.join(npmPrefixPath, 'openclaw.ps1'),
          kind: 'file',
        },
        {
          key: 'npm-prefix-openclaw-shim',
          label: 'npm prefix 启动脚本',
          path: path.join(npmPrefixPath, 'openclaw'),
          kind: 'file',
        }
      );
    }
  }

  const uniqueCandidates = Array.from(
    new Map(candidates.map((item) => [item.path.toLowerCase(), item])).values()
  );

  return uniqueCandidates
    .filter((item) => fs.existsSync(item.path))
    .map((item) => ({
      ...item,
      kind: fs.existsSync(item.path) && fs.lstatSync(item.path).isDirectory() ? 'directory' : item.kind,
    }));
}

function removeOpenClawResidueItem(item) {
  if (!fs.existsSync(item.path)) {
    return;
  }

  const stat = fs.lstatSync(item.path);
  if (stat.isDirectory()) {
    fs.rmSync(item.path, { recursive: true, force: true });
  } else {
    fs.rmSync(item.path, { force: true });
  }
}

async function resolveOpenClawResidueItem(selector = {}) {
  const detectedItems = await detectOpenClawResidueItems();
  return detectedItems.find((item) => (
    (selector.key && item.key === selector.key) ||
    (selector.path && item.path === selector.path)
  ));
}

export function registerInstallHandlers(ipcMain) {
  // 安装OpenClaw - 使用独立PowerShell窗口
  ipcMain.handle('install-openclaw', async (event, options = {}) => {
    const { enableGitProxy = false } = options;
    
    try {
      console.log('开始安装OpenClaw...');
      
      // 构建PowerShell脚本内容 - 使用简单格式，避免特殊字符
      const lines = [
        '# OpenClaw Installation Script',
        'chcp 65001 | Out-Null',
      ];
      
      if (enableGitProxy) {
        lines.push('Write-Host "Configuring Git proxy..." -ForegroundColor Yellow');
        lines.push('git config --global --replace-all url."https://github.com/".insteadOf ssh://git@github.com/');
        lines.push('Write-Host "Git proxy configured" -ForegroundColor Green');
      }
      
      lines.push('Write-Host ""');
      lines.push('Write-Host "========================================" -ForegroundColor Cyan');
      lines.push('Write-Host "  Installing OpenClaw..." -ForegroundColor Cyan');
      lines.push('Write-Host "========================================" -ForegroundColor Cyan');
      lines.push('Write-Host ""');
      lines.push('npm install -g openclaw@latest');
      lines.push('$installResult = $?');
      lines.push('Write-Host ""');
      lines.push('if ($installResult) {');
      lines.push('    Write-Host "========================================" -ForegroundColor Green');
      lines.push('    Write-Host "  OpenClaw installed successfully!" -ForegroundColor Green');
      lines.push('    Write-Host "========================================" -ForegroundColor Green');
      lines.push('    Write-Host ""');
      lines.push('    Write-Host "Verify installation with: openclaw --version" -ForegroundColor Yellow');
      lines.push('} else {');
      lines.push('    Write-Host "========================================" -ForegroundColor Red');
      lines.push('    Write-Host "  OpenClaw installation failed!" -ForegroundColor Red');
      lines.push('    Write-Host "========================================" -ForegroundColor Red');
      lines.push('    Write-Host ""');
      lines.push('    Write-Host "Troubleshooting:" -ForegroundColor Yellow');
      lines.push('    Write-Host "  1. Check network connection" -ForegroundColor White');
      lines.push('    Write-Host "  2. Enable Git proxy switch" -ForegroundColor White');
      lines.push('    Write-Host "  3. Use VPN or proxy" -ForegroundColor White');
      lines.push('}');
      lines.push('Write-Host ""');
      lines.push('Write-Host ""');
      lines.push('Write-Host "========================================" -ForegroundColor Cyan');
      lines.push('Write-Host "  安装完成！按回车键关闭此窗口..." -ForegroundColor Cyan');
      lines.push('Write-Host "========================================" -ForegroundColor Cyan');
      lines.push('[void][System.Console]::ReadLine()');
      
      const scriptContent = lines.join('\r\n');

      // 将命令写入临时脚本文件
      const tempDir = process.env.TEMP || process.env.TMP || 'C:\\Windows\\Temp';
      const scriptPath = path.join(tempDir, `openclaw-install-${Date.now()}.ps1`);

      try {
        fs.writeFileSync(scriptPath, scriptContent, 'utf8');
        console.log('安装脚本已写入:', scriptPath);
      } catch (writeError) {
        console.error('写入脚本文件失败:', writeError);
        return {
          success: false,
          error: `创建安装脚本失败: ${writeError.message}`,
          reasonType: 'unknown'
        };
      }
      
      // 使用spawn打开独立PowerShell窗口，并等待其关闭
      return new Promise((resolve) => {
        console.log('准备启动PowerShell，脚本路径:', scriptPath);
        
        // 使用 cmd /c start 启动 PowerShell 窗口，确保窗口可见
        const child = spawn('cmd.exe', [
          '/c', 'start', 'PowerShell', '-ExecutionPolicy', 'Bypass', '-File', scriptPath
        ], {
          detached: false,
          windowsHide: false,
          shell: false
        });
        
        console.log('PowerShell安装窗口已启动，PID:', child.pid);
        
        // 添加stdout和stderr监听以便调试
        child.stdout?.on('data', (data) => {
          console.log('PowerShell stdout:', data.toString());
        });
        
        child.stderr?.on('data', (data) => {
          console.error('PowerShell stderr:', data.toString());
        });
        
        child.on('close', (code) => {
          console.log('PowerShell窗口已关闭，退出码:', code);
          // 清理临时文件
          try {
            fs.unlinkSync(scriptPath);
          } catch {}
          
          // 窗口关闭后，检查OpenClaw是否安装成功
          resolve({ 
            success: true, 
            message: 'PowerShell安装窗口已关闭',
            detached: false,
            needVerify: true
          });
        });
        
        child.on('error', (error) => {
          console.error('启动PowerShell失败:', error);
          // 清理临时文件
          try {
            fs.unlinkSync(scriptPath);
          } catch {}
          resolve({ 
            success: false, 
            error: `启动安装窗口失败: ${error.message}`,
            reasonType: 'unknown'
          });
        });
        
        // 如果5秒内没有错误，认为窗口启动成功
        setTimeout(() => {
          console.log('PowerShell窗口应该已经打开');
        }, 5000);
      });
    } catch (error) {
      console.error('OpenClaw 安装失败:', error);
      return {
        success: false,
        error: error.message,
        reasonType: 'unknown'
      };
    }
  });

  // 启动OpenClaw网关
  ipcMain.handle('start-openclaw-gateway', async () => {
    return await startOpenClawGateway();
  });

  // 停止OpenClaw网关
  ipcMain.handle('stop-openclaw-gateway', async () => {
    return await stopOpenClawGateway();
  });

  // 重启OpenClaw网关
  ipcMain.handle('restart-openclaw-gateway', async () => {
    return await restartOpenClawGateway();
  });

  // 检查Gateway状态
  ipcMain.handle('check-gateway-status', async (event, port = 18789) => {
    return await checkGatewayStatus(port);
  });

  // 卸载OpenClaw
  ipcMain.handle('uninstall-openclaw', async () => {
    return await uninstallOpenClawCommand();
  });

  ipcMain.handle('detect-openclaw-residue', async () => {
    try {
      const items = await detectOpenClawResidueItems();
      return {
        success: true,
        items,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        items: [],
      };
    }
  });

  ipcMain.handle('cleanup-openclaw-residue', async () => {
    try {
      try {
        await uninstallOpenClawCommand();
      } catch (uninstallError) {
        console.log('清理残余前执行 npm uninstall 失败，继续清理残余:', uninstallError.message);
      }

      const detected = await detectOpenClawResidueItems();
      const removed = [];
      const failed = [];

      for (const item of detected) {
        try {
          removeOpenClawResidueItem(item);
          removed.push(item);
        } catch (error) {
          failed.push({
            ...item,
            error: error.message,
          });
        }
      }

      const remaining = await detectOpenClawResidueItems();

      return {
        success: failed.length === 0,
        removed,
        failed,
        remaining,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        removed: [],
        failed: [],
        remaining: [],
      };
    }
  });

  ipcMain.handle('remove-openclaw-residue-item', async (event, selector = {}) => {
    try {
      const target = await resolveOpenClawResidueItem(selector);
      if (!target) {
        return {
          success: false,
          error: '未找到指定的 OpenClaw 残余项，可能已经被删除。',
        };
      }

      removeOpenClawResidueItem(target);
      const remaining = await detectOpenClawResidueItems();

      return {
        success: true,
        removed: target,
        remaining,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });
}
