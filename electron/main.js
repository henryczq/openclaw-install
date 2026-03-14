import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

// 注意：app.isPackaged 在应用启动后才能准确判断
// 这里使用同步导入方式，在应用 ready 后再加载配置

// 导入所有 IPC handlers
import {
  registerSystemHandlers,
  registerConfigHandlers,
  registerAIHandlers,
  registerFeishuHandlers,
  registerQqHandlers,
  registerInstallHandlers,
  registerUtilsHandlers,
  registerChannelHandlers,
  loadAppSettings,
} from './ipc-handlers/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// 创建主窗口
function createWindow() {
  // 确定 preload 路径 - 使用 .cjs 版本（CommonJS 格式）
  const preloadPath = path.join(__dirname, 'preload.cjs');
  console.log('[Main] Preload path:', preloadPath);
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
  });

  // 完全移除菜单栏
  mainWindow.setMenu(null);

  // 根据环境加载不同的页面
  if (!app.isPackaged) {
    // 开发环境：加载 Vite 开发服务器
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境：加载打包后的文件
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('[Main] Loading index.html from:', indexPath);
    mainWindow.loadFile(indexPath);
  }
}

// 应用准备就绪
app.whenReady().then(async () => {
  // 在应用 ready 后加载环境变量（此时 app.isPackaged 准确）
  if (!app.isPackaged) {
    try {
      const dotenv = await import('dotenv');
      dotenv.default.config();
      console.log('[DEBUG] 开发环境：已加载 .env 文件');
    } catch (e) {
      console.log('[DEBUG] 未找到 dotenv');
    }
  } else {
    console.log('[DEBUG] 正式环境：不加载 .env 文件');
  }

  // 加载应用设置
  loadAppSettings();

  // 注册所有 IPC 处理程序
  registerSystemHandlers(ipcMain);
  registerConfigHandlers(ipcMain);
  registerAIHandlers(ipcMain);
  registerFeishuHandlers(ipcMain);
  registerQqHandlers(ipcMain);
  registerInstallHandlers(ipcMain);
  registerUtilsHandlers(ipcMain);
  registerChannelHandlers(ipcMain);

  // 重启应用
  ipcMain.handle('restart-app', (event, options = {}) => {
    console.log('Restarting app...', options);
    // 如果有继续安装的标志，保存到临时文件
    if (options.continueInstall) {
      const flagPath = path.join(os.tmpdir(), 'openclaw-install-continue.flag');
      fs.writeFileSync(flagPath, JSON.stringify({
        step: options.step || 'install-git',
        timestamp: Date.now()
      }));
    }
    app.relaunch();
    app.quit();
    return { success: true };
  });

  // 检查是否需要继续安装
  ipcMain.handle('check-continue-install', () => {
    const flagPath = path.join(os.tmpdir(), 'openclaw-install-continue.flag');
    try {
      if (fs.existsSync(flagPath)) {
        const data = JSON.parse(fs.readFileSync(flagPath, 'utf8'));
        // 检查是否在1小时内
        if (Date.now() - data.timestamp < 3600000) {
          return { shouldContinue: true, step: data.step };
        }
        // 过期删除
        fs.unlinkSync(flagPath);
      }
    } catch (e) {
      console.error('Check continue install error:', e);
    }
    return { shouldContinue: false };
  });

  // 清除继续安装标志
  ipcMain.handle('clear-continue-install', () => {
    const flagPath = path.join(os.tmpdir(), 'openclaw-install-continue.flag');
    try {
      if (fs.existsSync(flagPath)) {
        fs.unlinkSync(flagPath);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
