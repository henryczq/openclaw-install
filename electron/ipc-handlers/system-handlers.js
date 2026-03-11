// 系统检测相关 IPC 处理程序
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { checkOpenClawInstalled } from '../utils/openclaw-gateway-service.js';

const execAsync = promisify(exec);

export function registerSystemHandlers(ipcMain) {
  // 执行命令
  ipcMain.handle('execute-command', async (event, command, options = {}) => {
    try {
      // 使用 UTF-8 编码执行命令
      await execAsync('chcp 65001', { shell: 'cmd.exe' }).catch(() => {});
      const { stdout, stderr } = await execAsync(command, {
        timeout: options.timeout || 120000,
        ...options
      });
      return { success: true, stdout, stderr };
    } catch (error) {
      let errorMsg = error.message;
      if (error.stderr) {
        errorMsg = error.stderr.toString();
      }
      // 清理错误信息，移除乱码
      errorMsg = errorMsg.replace(/[\u0000-\u001F\u007F-\u00FF]/g, '');
      return { success: false, error: errorMsg, stdout: error.stdout, stderr: error.stderr };
    }
  });

  // 检查Node.js版本
  ipcMain.handle('check-node', async () => {
    try {
      await execAsync('chcp 65001', { shell: 'cmd.exe' }).catch(() => {});
      const { stdout } = await execAsync('node -v');
      const version = stdout.trim().replace('v', '');
      const majorVersion = parseInt(version.split('.')[0]);
      return { 
        installed: true, 
        version, 
        majorVersion,
        needUpdate: majorVersion < 22 
      };
    } catch (error) {
      return { installed: false, needUpdate: true };
    }
  });

  // 检查npm版本
  ipcMain.handle('check-npm', async () => {
    try {
      await execAsync('chcp 65001', { shell: 'cmd.exe' }).catch(() => {});
      const { stdout } = await execAsync('npm -v');
      return { installed: true, version: stdout.trim() };
    } catch (error) {
      return { installed: false };
    }
  });

  // 检查Git版本
  ipcMain.handle('check-git', async () => {
    try {
      await execAsync('chcp 65001', { shell: 'cmd.exe' }).catch(() => {});
      const { stdout } = await execAsync('git --version');
      const match = stdout.match(/git version (\d+\.\.?\d*)/);
      const version = match ? match[1] : 'unknown';
      const majorVersion = parseInt(version.split('.')[0]);
      return { 
        installed: true, 
        version, 
        majorVersion,
        needUpdate: majorVersion < 2 
      };
    } catch (error) {
      return { installed: false, needUpdate: true };
    }
  });

  // 检查OpenClaw
  ipcMain.handle('check-openclaw', async (event, strictMode = false) => {
    return await checkOpenClawInstalled(strictMode);
  });

  // 设置npm国内源
  ipcMain.handle('set-npm-registry', async () => {
    try {
      // 使用 UTF-8 编码执行命令
      await execAsync('chcp 65001', { shell: 'cmd.exe' }).catch(() => {});
      
      // 尝试直接执行 npm 命令
      try {
        await execAsync('npm config set registry https://registry.npmmirror.com');
        const { stdout } = await execAsync('npm config get registry');
        return { success: true, registry: stdout.trim() };
      } catch (npmError) {
        // 如果直接执行失败，尝试使用 Node.js 安装目录下的 npm
        console.log('直接执行 npm 失败，尝试使用完整路径...');
        
        // 尝试从常见的 Node.js 安装路径执行
        const nodePaths = [
          'C:\\Program Files\\nodejs\\npm.cmd',
          'C:\\Program Files (x86)\\nodejs\\npm.cmd',
          process.env.ProgramFiles + '\\nodejs\\npm.cmd',
          process.env['ProgramFiles(x86)'] + '\\nodejs\\npm.cmd'
        ];
        
        for (const npmPath of nodePaths) {
          try {
            console.log('尝试使用路径:', npmPath);
            await execAsync(`"${npmPath}" config set registry https://registry.npmmirror.com`);
            const { stdout } = await execAsync(`"${npmPath}" config get registry`);
            return { success: true, registry: stdout.trim() };
          } catch (pathError) {
            console.log('路径失败:', npmPath, pathError.message);
            continue;
          }
        }
        
        // 所有路径都失败，返回原始错误
        throw npmError;
      }
    } catch (error) {
      // 处理可能的编码问题
      let errorMsg = error.message;
      if (error.stderr) {
        errorMsg = error.stderr.toString();
      }
      // 检查是否是 npm 未找到的错误
      if (errorMsg.includes('npm') && (errorMsg.includes('not found') || errorMsg.includes('��找到'))) {
        return { success: false, error: 'npm 命令未找到，请确保 Node.js 已正确安装并添加到环境变量' };
      }
      return { success: false, error: errorMsg };
    }
  });

  // 配置Git代理
  ipcMain.handle('config-git-proxy', async () => {
    try {
      await execAsync('git config --global --replace-all url."https://github.com/".insteadOf ssh://git@github.com/');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检测端口是否开放
  ipcMain.handle('check-port', async (event, port) => {
    try {
      const { stdout } = await execAsync(`powershell.exe -Command "Test-NetConnection -ComputerName localhost -Port ${port} -WarningAction SilentlyContinue | Select-Object -ExpandProperty TcpTestSucceeded"`);
      const isOpen = stdout.trim() === 'True';
      return { open: isOpen, port };
    } catch (error) {
      // 如果命令失败，尝试另一种方式
      try {
        const { stdout } = await execAsync(`netstat -an | findstr :${port}`);
        const isOpen = stdout.includes('LISTENING') || stdout.includes('ESTABLISHED');
        return { open: isOpen, port };
      } catch {
        return { open: false, port, error: error.message };
      }
    }
  });

  // 获取系统信息
  ipcMain.handle('get-system-info', async () => {
    try {
      return {
        platform: os.platform(),
        arch: os.arch(),
        version: os.version(),
        tempPath: os.tmpdir()
      };
    } catch (error) {
      console.error('[get-system-info] Error:', error);
      return {
        platform: process.platform,
        arch: process.arch,
        version: process.version,
        tempPath: process.env.TEMP || process.env.TMP || '/tmp'
      };
    }
  });

  // 检查 VC++ 运行库是否安装
  ipcMain.handle('check-vcredist', async () => {
    try {
      // 仅在 Windows 下检查
      if (process.platform !== 'win32') {
        return { installed: true, message: '非 Windows 系统，跳过检查' };
      }

      // 获取 Windows 系统的 System32 目录和 SysWOW64 目录
      const windir = process.env.windir || 'C:\\Windows';
      const system32Path = path.join(windir, 'System32');
      const sysWOW64Path = path.join(windir, 'SysWOW64');

      // 检查关键的运行库文件是否存在（多个位置）
      const checkPaths = [
        path.join(system32Path, 'vcruntime140.dll'),
        path.join(system32Path, 'msvcp140.dll'),
        path.join(sysWOW64Path, 'vcruntime140.dll'),
        path.join(sysWOW64Path, 'msvcp140.dll'),
      ];

      const results = {};
      let foundCount = 0;
      for (const checkPath of checkPaths) {
        const exists = fs.existsSync(checkPath);
        results[path.basename(checkPath) + '_' + path.dirname(checkPath).split('\\').pop()] = exists;
        if (exists) foundCount++;
      }

      // 也检查注册表
      let registryInstalled = false;
      try {
        const { stdout } = await execAsync('reg query "HKLM\\SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64" /v Version 2>nul || reg query "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64" /v Version 2>nul || echo NOT_FOUND');
        registryInstalled = stdout.includes('Version') && !stdout.includes('NOT_FOUND');
      } catch (e) {
        // 注册表查询失败，忽略
      }

      // 如果找到至少2个DLL文件，或者注册表有记录，认为已安装
      const installed = foundCount >= 2 || registryInstalled;

      console.log('[check-vcredist] 检测结果:', { foundCount, registryInstalled, results });

      return {
        installed,
        foundCount,
        registryInstalled,
        details: results,
        message: installed ? 'VC++ 运行库已安装' : '缺少 VC++ 运行库'
      };
    } catch (error) {
      console.error('[check-vcredist] Error:', error);
      return { installed: false, error: error.message };
    }
  });
}
