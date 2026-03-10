import { exec, execSync } from 'child_process';
import fs from 'fs';
import { BrowserWindow, shell } from 'electron';
import { createAutomationWindowManager } from './ai/provider-window.js';
import { getConfigPath } from './config-handlers.js';
import { isDebugEnabled } from '../config/debug-config.js';

let qqWindow = null;

const automation = createAutomationWindowManager({
  title: 'QQ机器人管理平台'
});

const ensureQqWindow = () => {
  if (qqWindow && !qqWindow.isDestroyed()) return qqWindow;
  qqWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'QQ机器人管理',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  return qqWindow;
};

export function registerQqHandlers(ipcMain) {
  // 检查OpenClaw是否安装
  const checkOpenClawInstalled = async () => {
    try {
      const { stdout } = await import('child_process').then(m => m.execSync('openclaw --version', { encoding: 'utf-8', windowsHide: true }));
      return { installed: true, version: stdout.trim() };
    } catch (error) {
      return { installed: false, error: 'OpenClaw 未安装' };
    }
  };

  // 检查QQ插件
  ipcMain.handle('check-qq-plugin', async () => {
    try {
      // 先检查OpenClaw是否安装
      const openclawStatus = await checkOpenClawInstalled();
      if (!openclawStatus.installed) {
        return { installed: false, error: 'OpenClaw 未安装，请先安装 OpenClaw' };
      }

      // 使用 UTF-8 编码执行命令
      const { execSync } = await import('child_process');
      await import('child_process').then(m => m.execSync('chcp 65001', { shell: 'cmd.exe' })).catch(() => {});
      const stdout = execSync('openclaw plugins list', { encoding: 'utf-8', windowsHide: true });
      console.log('插件列表输出:', stdout);

      // 检查是否包含QQ Bot相关的行
      const lines = stdout.split('\n');
      const hasQqBot = lines.some(line => {
        const lowerLine = line.toLowerCase();
        return (lowerLine.includes('qq bot') || lowerLine.includes('qqbot'))
               && (lowerLine.includes('loaded') || lowerLine.includes('enabled'));
      });

      console.log('QQ插件检测结果:', hasQqBot);
      return { installed: hasQqBot, output: stdout };
    } catch (error) {
      console.error('检查QQ插件失败:', error);
      // 处理错误信息，避免乱码
      let errorMsg = error.message;
      if (error.stderr) {
        errorMsg = error.stderr.toString();
      }
      // 清理错误信息，移除乱码
      errorMsg = errorMsg.replace(/[\u0000-\u001F\u007F-\u00FF]/g, '');
      // 检查是否是 OpenClaw 未安装的错误
      if (errorMsg.includes('openclaw') && (errorMsg.includes('not found') || errorMsg.includes('未找到'))) {
        return { installed: false, error: 'OpenClaw 未安装，请先安装 OpenClaw' };
      }
      return { installed: false, error: errorMsg };
    }
  });

  // 安装QQ插件
  ipcMain.handle('install-qq-plugin', async () => {
    return new Promise((resolve) => {
      try {
        // 先检查OpenClaw是否安装
        checkOpenClawInstalled().then(openclawStatus => {
          if (!openclawStatus.installed) {
            resolve({ success: false, error: 'OpenClaw 未安装，请先安装 OpenClaw' });
            return;
          }

          // 使用 UTF-8 编码执行命令
          exec('chcp 65001', { shell: 'cmd.exe' }).catch(() => {});
          const child = exec('openclaw plugins install @tencent-connect/openclaw-qqbot@latest', {
            timeout: 120000,
            windowsHide: true
          });
          
          let output = '';
          child.stdout.on('data', (data) => {
            output += data.toString();
          });
          child.stderr.on('data', (data) => {
            output += data.toString();
          });
          
          child.on('close', (code) => {
            if (code === 0) {
              resolve({ success: true, output });
            } else {
              // 处理错误信息，避免乱码
              let errorMsg = output || '安装失败';
              // 清理错误信息，移除乱码
              errorMsg = errorMsg.replace(/[\u0000-\u001F\u007F-\u00FF]/g, '');
              if (errorMsg.includes('openclaw') && (errorMsg.includes('not found') || errorMsg.includes('未找到'))) {
                errorMsg = 'OpenClaw 未安装，请先安装 OpenClaw';
              }
              resolve({ success: false, error: errorMsg });
            }
          });
          
          child.on('error', (error) => {
            let errorMsg = error.message;
            // 清理错误信息，移除乱码
            errorMsg = errorMsg.replace(/[\u0000-\u001F\u007F-\u00FF]/g, '');
            if (errorMsg.includes('openclaw') && (errorMsg.includes('not found') || errorMsg.includes('未找到'))) {
              errorMsg = 'OpenClaw 未安装，请先安装 OpenClaw';
            }
            resolve({ success: false, error: errorMsg });
          });
        });
      } catch (error) {
        let errorMsg = error.message;
        // 清理错误信息，移除乱码
        errorMsg = errorMsg.replace(/[\u0000-\u001F\u007F-\u00FF]/g, '');
        if (errorMsg.includes('openclaw') && (errorMsg.includes('not found') || errorMsg.includes('未找到'))) {
          errorMsg = 'OpenClaw 未安装，请先安装 OpenClaw';
        }
        resolve({ success: false, error: errorMsg });
      }
    });
  });

  // 打开QQ机器人管理页面
  ipcMain.handle('open-qq-console', async () => {
    try {
      const windowInstance = automation.ensureWindow();
      const url = 'https://q.qq.com/qqbot/openclaw/index.html';
      await windowInstance.loadURL(url);
      windowInstance.show();
      return { success: true, message: '已打开QQ机器人管理页面' };
    } catch (error) {
      console.error('打开QQ管理页面失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 检查QQ管理页面登录状态 - 只检查特定的创建机器人按钮
  ipcMain.handle('qq-check-login', async () => {
    try {
      console.log('[qq-check-login] 开始检查登录状态...');
      
      const result = await automation.inject(`
        (() => {
          // 只检查 .robot-section__btn 这个特定的按钮（登录后管理页面的蓝色按钮）
          const createBtn = document.querySelector('.robot-section__btn');
          
          // 检查是否有机器人列表（已登录的另一个标志）
          const robotCards = document.querySelectorAll('.robot-card');
          const hasRobotCards = robotCards.length > 0;
          
          // 检查页面URL（登录后的页面URL不同）
          const pageUrl = window.location.href;
          const isManagePage = pageUrl.includes('/qqbot/') && !pageUrl.includes('/login');
          
          return { 
            loggedIn: !!(createBtn || hasRobotCards),
            hasCreateBtn: !!createBtn,
            hasRobotCards,
            pageUrl
          };
        })()
      `);
      
      console.log('[qq-check-login] 检查结果:', result);
      return result;
    } catch (error) {
      console.error('[qq-check-login] 检查登录状态失败:', error);
      return { loggedIn: false, error: error.message };
    }
  });

  // 创建QQ机器人
  ipcMain.handle('qq-create-robot', async () => {
    try {
      const windowInstance = automation.ensureWindow();
      // 不重新加载页面，直接使用当前页面
      windowInstance.show();

      const result = await automation.inject(`
        (async () => {
          const sleep = window.RPA.sleep;
          await sleep(1000);

          // 多种方式查找创建机器人按钮
          const selectors = [
            '.robot-section__btn',
            '[class*="robot-section"]',
            'button'
          ];
          
          let createBtn = null;
          for (const selector of selectors) {
            const btns = Array.from(document.querySelectorAll(selector));
            const found = btns.find(btn => 
              btn.textContent?.includes('创建机器人')
            );
            if (found) {
              createBtn = found;
              break;
            }
          }
          
          if (createBtn) {
            createBtn.click();
            await sleep(5000);
            return { success: true };
          }
          return { success: false, error: '未找到创建机器人按钮' };
        })()
      `);

      return result;
    } catch (error) {
      console.error('创建QQ机器人失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取QQ凭证
  ipcMain.handle('qq-get-credentials', async () => {
    try {
      const windowInstance = automation.ensureWindow();

      const result = await automation.inject(`
        (async () => {
          const sleep = window.RPA.sleep;
          await sleep(1000);

          const cards = document.querySelectorAll('.robot-card');
          if (cards.length === 0) {
            return { success: false, error: '未找到机器人卡片' };
          }

          const firstCard = cards[0];
          const appIdEl = firstCard.querySelector('.robot-card__value');
          const appId = appIdEl ? appIdEl.textContent.trim() : '';

          // 尝试获取AppSecret
          let appSecret = '';
          const secretEl = firstCard.querySelectorAll('.robot-card__value')[1];
          if (secretEl) {
            appSecret = secretEl.textContent.trim();
          }

          if (appId) {
            return { success: true, data: { appId, appSecret } };
          }
          return { success: false, error: '未获取到AppID' };
        })()
      `);

      // 获取成功后关闭浏览器窗口
      if (result.success) {
        automation.closeWindow();
        console.log('获取QQ凭证成功，已关闭浏览器窗口');
      }

      return result;
    } catch (error) {
      console.error('获取QQ凭证失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 配置QQ渠道
  ipcMain.handle('config-qq-channel', async (event, appId, appSecret) => {
    try {
      // DEBUG 模式下跳过实际绑定
      if (isDebugEnabled()) {
        console.log('[DEBUG] 跳过 QQ 渠道绑定:', { appId, appSecret: appSecret.substring(0, 4) + '...' });
        return { success: true, message: '[DEBUG] 已跳过 QQ 渠道绑定' };
      }
      
      const token = `${appId}:${appSecret}`;
      execSync(`openclaw channels add --channel qqbot --token "${token}"`, { 
        encoding: 'utf-8',
        windowsHide: true 
      });
      return { success: true, message: 'QQ渠道配置成功' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
