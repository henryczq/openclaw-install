import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { BrowserWindow, shell } from 'electron';
import { createAutomationWindowManager } from './ai/provider-window.js';
import { getConfigPath } from './config-handlers.js';
import { checkOpenClawInstalled, restartOpenClawGateway } from '../utils/openclaw-gateway-service.js';
import { 
  listOpenClawPlugins, 
  installOpenClawPlugin, 
  addOpenClawChannel 
} from '../utils/openclaw-commands.js';

const execAsync = promisify(exec);

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
  // 检查QQ插件
  ipcMain.handle('check-qq-plugin', async () => {
    try {
      // 先检查OpenClaw是否安装
      const openclawStatus = await checkOpenClawInstalled();
      if (!openclawStatus.installed) {
        return { installed: false, error: 'OpenClaw 未安装，请先安装 OpenClaw' };
      }

      // 使用公共方法获取插件列表
      const result = await listOpenClawPlugins();
      if (!result.success) {
        return { installed: false, error: result.error };
      }

      console.log('插件列表:', result.plugins);

      // 检查是否包含QQ Bot相关的插件
      // QQ插件可能的名称: @openclaw/qqbot, openclaw-qqbot, qqbot, qq-bot, qq 等
      const hasQqBot = result.plugins.some(plugin => {
        const lowerPlugin = plugin.toLowerCase();
        const isMatch = lowerPlugin.includes('qq') || 
                       lowerPlugin.includes('tencent') ||
                       lowerPlugin === 'qqbot' ||
                       lowerPlugin === '@openclaw/qqbot' ||
                       lowerPlugin.includes('qqbot');
        if (isMatch) {
          console.log('找到QQ插件:', plugin);
        }
        return isMatch;
      });

      console.log('QQ插件检测结果:', hasQqBot);
      return { installed: hasQqBot, output: result.plugins.join('\n') };
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
    try {
      // 先检查OpenClaw是否安装
      const openclawStatus = await checkOpenClawInstalled();
      if (!openclawStatus.installed) {
        return { success: false, error: 'OpenClaw 未安装，请先安装 OpenClaw' };
      }

      // 使用公共方法安装插件
      const result = await installOpenClawPlugin('@tencent-connect/openclaw-qqbot@latest');
      return result;
    } catch (error) {
      let errorMsg = error.message;
      // 清理错误信息，移除乱码
      errorMsg = errorMsg.replace(/[\u0000-\u001F\u007F-\u00FF]/g, '');
      if (errorMsg.includes('openclaw') && (errorMsg.includes('not found') || errorMsg.includes('未找到'))) {
        errorMsg = 'OpenClaw 未安装，请先安装 OpenClaw';
      }
      return { success: false, error: errorMsg };
    }
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

          const logs = [];
          
          // 尝试获取AppSecret
          let appSecret = '';
          const secretEl = firstCard.querySelectorAll('.robot-card__value')[1];
          if (secretEl) {
            appSecret = secretEl.textContent.trim();
            logs.push('读取到AppSecret: [' + appSecret + ']');
            logs.push('AppSecret长度: ' + appSecret.length);
            logs.push('是否包含*: ' + appSecret.includes('*'));
          } else {
            logs.push('未找到AppSecret元素');
          }
          
          // 如果AppSecret是*号（被隐藏），点击"查看"按钮处理弹窗
          if (appSecret.includes('*')) {
            logs.push('AppSecret被隐藏，尝试点击第一个机器人卡片的"查看"按钮');
            
            // 在第一个机器人卡片内查找"查看"按钮
            // 根据用户提供的HTML结构: <div class="robot-card__action"><button type="button" class="robot-card__link">查看</button></div>
            let viewBtn = firstCard.querySelector('.robot-card__action button.robot-card__link');
            logs.push('查找按钮1 (.robot-card__action button.robot-card__link): ' + (viewBtn ? '找到' : '未找到'));
            
            if (!viewBtn) {
              // 尝试更宽泛的选择器
              viewBtn = firstCard.querySelector('.robot-card__action button');
              logs.push('查找按钮2 (.robot-card__action button): ' + (viewBtn ? '找到' : '未找到'));
            }
            
            if (!viewBtn) {
              // 查找所有按钮，找包含"查看"文本的
              const allButtons = firstCard.querySelectorAll('button');
              logs.push('卡片内所有按钮数量: ' + allButtons.length);
              for (const btn of allButtons) {
                const btnText = btn.textContent.trim();
                logs.push('按钮文本: [' + btnText + ']');
                if (btnText === '查看') {
                  viewBtn = btn;
                  logs.push('找到"查看"按钮');
                  break;
                }
              }
            }
            
            if (viewBtn) {
              logs.push('找到按钮，文本: [' + viewBtn.textContent.trim() + ']');
              logs.push('按钮HTML: ' + viewBtn.outerHTML.substring(0, 200));
              
              // 如果按钮文本为空，可能是子元素包含文本，尝试查找子元素
              if (!viewBtn.textContent.trim()) {
                const childWithText = viewBtn.querySelector('span, div, i');
                if (childWithText) {
                  logs.push('按钮子元素文本: [' + childWithText.textContent.trim() + ']');
                }
              }
              
              viewBtn.click();
              logs.push('已点击按钮');
              await sleep(1500); // 等待弹窗出现
              
              // 查找"确认重置"按钮并点击
              const confirmBtn = document.querySelector('.q-dialog__btn--confirm');
              if (confirmBtn) {
                logs.push('找到"确认重置"按钮，正在点击');
                confirmBtn.click();
                
                // 等待5秒让AppSecret显示
                logs.push('等待5秒让AppSecret显示...');
                await sleep(5000);
                
                // 重新读取AppSecret
                const secretElAfterReset = firstCard.querySelectorAll('.robot-card__value')[1];
                if (secretElAfterReset) {
                  appSecret = secretElAfterReset.textContent.trim();
                  logs.push('重置后读取AppSecret: ' + appSecret.substring(0, 4) + '****');
                }
              } else {
                logs.push('未找到"确认重置"按钮');
              }
            } else {
              logs.push('未找到"查看"按钮');
            }
          }

          // 如果AppSecret仍然是*号，需要用户手动输入
          if (appSecret.includes('*')) {
            return { 
              success: false, 
              error: 'AppSecret需要手动获取', 
              needManualInput: true,
              data: { appId, appSecret: '' },
              logs: logs
            };
          }

          if (appId) {
            return { success: true, data: { appId, appSecret }, logs: logs };
          }
          return { success: false, error: '未获取到AppID', logs: logs };
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
      const token = `${appId}:${appSecret}`;
      return await addOpenClawChannel('qqbot', token);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查QQ渠道是否存在（指定appId）
  ipcMain.handle('check-qq-channel-exists', async (event, appId) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      
      const getConfigPath = () => {
        if (process.env.OPENCLAW_CONFIG_PATH) {
          return process.env.OPENCLAW_CONFIG_PATH;
        }
        const openclawDir = process.env.OPENCLAW_STATE_DIR || 
                           (process.env.OPENCLAW_HOME ? path.join(process.env.OPENCLAW_HOME, '.openclaw') : 
                            path.join(os.homedir(), '.openclaw'));
        return path.join(openclawDir, 'openclaw.json');
      };
      
      const configPath = getConfigPath();
      
      if (!fs.existsSync(configPath)) {
        return { exists: false };
      }
      
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);
      
      if (config.channels && config.channels.qqbot) {
        // 配置文件中使用 appId 字段存储
        const existingAppId = config.channels.qqbot.appId;
        console.log(`[check-qq-channel-exists] 找到qqbot配置，existingAppId=${existingAppId}, 当前appId=${appId}`);
        return { exists: existingAppId === appId, existingAppId };
      }
      
      console.log(`[check-qq-channel-exists] 未找到qqbot配置`);
      return { exists: false };
    } catch (error) {
      console.error('检查QQ渠道失败:', error);
      return { exists: false, error: error.message };
    }
  });

  // 删除QQ渠道配置
  ipcMain.handle('delete-qq-channel', async () => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      
      const getConfigPath = () => {
        if (process.env.OPENCLAW_CONFIG_PATH) {
          return process.env.OPENCLAW_CONFIG_PATH;
        }
        const openclawDir = process.env.OPENCLAW_STATE_DIR || 
                           (process.env.OPENCLAW_HOME ? path.join(process.env.OPENCLAW_HOME, '.openclaw') : 
                            path.join(os.homedir(), '.openclaw'));
        return path.join(openclawDir, 'openclaw.json');
      };
      
      const configPath = getConfigPath();
      
      if (!fs.existsSync(configPath)) {
        return { success: true, message: '配置文件不存在' };
      }
      
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);
      
      if (config.channels && config.channels.qqbot) {
        delete config.channels.qqbot;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        return { success: true, message: '已删除qqbot配置' };
      }
      
      return { success: true, message: 'qqbot配置不存在' };
    } catch (error) {
      console.error('删除QQ渠道失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 重启 OpenClaw 服务
  ipcMain.handle('restart-openclaw', async () => {
    return await restartOpenClawGateway();
  });
}
