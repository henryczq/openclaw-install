// 工具函数相关 IPC 处理程序
import { ipcMain, shell, dialog } from 'electron';
import fs from 'fs';
const getFetch = () => {
  if (typeof fetch === 'function') return fetch;
  return (...args) => import('node-fetch').then((mod) => mod.default(...args));
};

export function registerUtilsHandlers(mainWindow) {
  // 打开外部链接
  ipcMain.handle('open-external', async (event, url) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 显示消息对话框
  ipcMain.handle('show-message-box', async (event, options) => {
    const result = await dialog.showMessageBox(mainWindow, options);
    return result;
  });

  // 显示打开文件对话框
  ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });

  // 显示保存文件对话框
  ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  });

  // 下载文件
  ipcMain.handle('download-file', async (event, url, destPath) => {
    try {
      const fetcher = await getFetch();
      const response = await fetcher(url);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(destPath, Buffer.from(buffer));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 下载文件（带进度）
  ipcMain.handle('download-file-with-progress', async (event, url, destPath) => {
    try {
      const fetcher = await getFetch();
      const response = await fetcher(url);
      const totalSize = parseInt(response.headers.get('content-length') || '0');
      const reader = response.body.getReader();
      const chunks = [];
      let receivedSize = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedSize += value.length;
        
        if (totalSize > 0) {
          const progress = Math.round((receivedSize / totalSize) * 100);
          event.sender.send('download-progress', { url, progress, receivedSize, totalSize });
        }
      }
      
      // 合并所有 chunks
      const allChunks = new Uint8Array(receivedSize);
      let position = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }
      
      fs.writeFileSync(destPath, Buffer.from(allChunks));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 读取文件
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 写入文件
  ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查文件是否存在
  ipcMain.handle('file-exists', async (event, filePath) => {
    try {
      const exists = fs.existsSync(filePath);
      return { exists };
    } catch (error) {
      return { exists: false, error: error.message };
    }
  });

  // 创建目录
  ipcMain.handle('mkdir', async (event, dirPath, options = {}) => {
    try {
      fs.mkdirSync(dirPath, { recursive: options.recursive || false });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
