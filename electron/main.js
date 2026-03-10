import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

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
