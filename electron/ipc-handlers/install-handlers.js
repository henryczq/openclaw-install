// 安装和卸载相关 IPC 处理程序
import { exec, execSync, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

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
      lines.push('Write-Host "Press any key to close..." -ForegroundColor Gray');
      lines.push('[void][System.Console]::ReadKey($true)');
      
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
      
      // 使用spawn打开独立PowerShell窗口
      return new Promise((resolve) => {
        // 使用 cmd /c start 来确保窗口显示
        const child = spawn('cmd.exe', [
          '/c',
          'start',
          'powershell.exe',
          '-NoExit',
          '-ExecutionPolicy', 'Bypass',
          '-File', scriptPath
        ], {
          detached: true,
          windowsHide: false,
          shell: false
        });
        
        // cmd 会立即返回，因为使用了 start 命令
        child.on('close', () => {
          console.log('CMD启动器已关闭，PowerShell窗口应该已打开');
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
        
        // 立即返回，让用户在窗口中查看进度
        resolve({ 
          success: true, 
          message: '安装命令已在独立PowerShell窗口中启动，请在新窗口中查看安装进度',
          detached: true
        });
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

  // 运行openclaw onboard
  ipcMain.handle('openclaw-onboard', async () => {
    try {
      const { stdout } = await execAsync('openclaw onboard', { timeout: 60000 });
      return { success: true, output: stdout };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 启动OpenClaw网关
  ipcMain.handle('start-openclaw-gateway', async () => {
    try {
      const { stdout } = await execAsync('openclaw gateway --port 18789', { timeout: 30000 });
      return { success: true, output: stdout };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 卸载OpenClaw
  ipcMain.handle('uninstall-openclaw', async () => {
    try {
      const { stdout } = await execAsync('npm uninstall -g openclaw', { timeout: 120000 });
      return { success: true, output: stdout };
    } catch (error) {
      return { success: false, error: error.message };
    }
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
        await execAsync('npm uninstall -g openclaw', { timeout: 120000 });
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
