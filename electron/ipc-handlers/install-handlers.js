// 安装和卸载相关 IPC 处理程序
import { exec, execSync, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const execAsync = promisify(exec);

export function registerInstallHandlers(ipcMain) {
  // 安装OpenClaw
  ipcMain.handle('install-openclaw', async () => {
    try {
      console.log('开始安装OpenClaw...');
      
      // 设置执行策略
      try {
        await execAsync('chcp 65001', { shell: 'cmd.exe' }).catch(() => {});
        await execAsync('powershell.exe -Command "Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"');
        console.log('执行策略设置成功');
      } catch (policyError) {
        console.log('执行策略设置失败，继续执行:', policyError.message);
      }
      
      // 尝试使用 npm 直接安装
      try {
        console.log('尝试使用 npm 直接安装 OpenClaw...');
        await execAsync('chcp 65001', { shell: 'cmd.exe' }).catch(() => {});
        const { stdout: npmStdout, stderr: npmStderr } = await execAsync(
          'npm install -g openclaw',
          { timeout: 300000 }
        );
        console.log('npm 安装成功:', npmStdout);
        return { success: true, stdout: npmStdout, stderr: npmStderr };
      } catch (npmError) {
        console.log('npm 安装失败，尝试使用官方安装脚本:', npmError.message);
        
        // 尝试使用官方安装脚本
        try {
          console.log('使用官方安装脚本安装 OpenClaw...');
          await execAsync('chcp 65001', { shell: 'cmd.exe' }).catch(() => {});
          const { stdout, stderr } = await execAsync(
            'powershell.exe -Command "iwr -useb https://openclaw.ai/install.ps1 | iex"',
            { timeout: 300000 }
          );
          console.log('官方脚本安装成功:', stdout);
          return { success: true, stdout: stdout, stderr: stderr };
        } catch (scriptError) {
          console.log('官方脚本安装失败:', scriptError.message);
          
          // 检查是否是 npm 未找到的错误
          if (scriptError.message.includes('npm') && (scriptError.message.includes('not found') || scriptError.message.includes('��找到'))) {
            // 尝试使用 Node.js 安装目录下的 npm
            console.log('尝试使用 Node.js 安装目录下的 npm...');
            const nodePaths = [
              'C:\\Program Files\\nodejs\\npm.cmd',
              'C:\\Program Files (x86)\\nodejs\\npm.cmd',
              process.env.ProgramFiles + '\\nodejs\\npm.cmd',
              process.env['ProgramFiles(x86)'] + '\\nodejs\\npm.cmd'
            ];
            
            for (const npmPath of nodePaths) {
              try {
                console.log('尝试使用路径:', npmPath);
                await execAsync('chcp 65001', { shell: 'cmd.exe' }).catch(() => {});
                const { stdout: pathStdout, stderr: pathStderr } = await execAsync(
                  `"${npmPath}" install -g openclaw`,
                  { timeout: 300000 }
                );
                console.log('路径安装成功:', pathStdout);
                return { success: true, stdout: pathStdout, stderr: pathStderr };
              } catch (pathError) {
                console.log('路径安装失败:', npmPath, pathError.message);
                continue;
              }
            }
          }
          
          throw scriptError;
        }
      }
    } catch (error) {
      console.error('OpenClaw 安装失败:', error);
      let errorMsg = error.message;
      if (error.stderr) {
        errorMsg = error.stderr.toString();
      }
      if (error.stdout) {
        console.log('安装输出:', error.stdout.toString());
      }
      // 处理常见错误
      if (errorMsg.includes('npm') && (errorMsg.includes('not found') || errorMsg.includes('��找到'))) {
        return { success: false, error: 'npm 命令未找到，请确保 Node.js 已正确安装并添加到环境变量' };
      }
      if (errorMsg.includes('无法连接到远程服务器') || errorMsg.includes('Could not connect')) {
        return { success: false, error: '网络连接失败，请检查网络连接后重试' };
      }
      if (errorMsg.includes('npm error code 128')) {
        return { success: false, error: 'npm 安装失败，可能是网络连接问题或权限不足，请尝试以管理员身份运行应用' };
      }
      // 清理错误信息，移除乱码
      errorMsg = errorMsg.replace(/[\u0000-\u001F\u007F-\u00FF]/g, '');
      return { success: false, error: errorMsg };
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
      const child = exec('openclaw gateway start', { 
        timeout: 10000,
        detached: true,
        windowsHide: true
      });
      
      return { success: true, message: '网关启动命令已执行' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 重启OpenClaw
  ipcMain.handle('restart-openclaw', async () => {
    try {
      // 先停止 gateway
      try {
        await execAsync('openclaw gateway stop');
      } catch (stopError) {
        // 如果停止失败，可能是服务没运行，忽略错误继续
        console.log('停止 gateway 失败（可能服务未运行）:', stopError);
      }
      
      // 等待1秒确保服务已停止
      await new Promise(r => setTimeout(r, 1000));
      
      // 启动 gateway
      await execAsync('openclaw gateway start');
      return { success: true, message: 'OpenClaw gateway 已重启' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 卸载OpenClaw
  ipcMain.handle('uninstall-openclaw', async () => {
    try {
      await execAsync('npm uninstall -g openclaw');
      
      // 删除配置目录
      const homeDir = process.env.USERPROFILE || process.env.HOME;
      const openclawDir = path.join(homeDir, '.openclaw');
      if (fs.existsSync(openclawDir)) {
        fs.rmSync(openclawDir, { recursive: true, force: true });
      }
      
      return { success: true, message: 'OpenClaw 已卸载' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查OpenClaw更新
  ipcMain.handle('check-openclaw-update', async () => {
    try {
      const { stdout } = await execAsync('npm outdated -g openclaw');
      const hasUpdate = stdout.includes('openclaw');
      return { hasUpdate, output: stdout };
    } catch (error) {
      // npm outdated 返回非零退出码表示有更新或错误
      return { hasUpdate: false, error: error.message };
    }
  });

  // 更新OpenClaw
  ipcMain.handle('update-openclaw', async () => {
    try {
      const { stdout, stderr } = await execAsync('npm update -g openclaw', { timeout: 120000 });
      return { success: true, stdout, stderr };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
