// 配置管理相关 IPC 处理程序
import fs from 'fs';
import path from 'path';
import { isDebugEnabled, getCurrentConfigPath } from '../config/debug-config.js';

// 获取当前配置路径
export function getConfigPath() {
  return getCurrentConfigPath();
}

// 加载应用设置
export function loadAppSettings() {
  console.log('Current config path:', getCurrentConfigPath());
  console.log('Debug mode:', isDebugEnabled());
}

export function registerConfigHandlers(ipcMain) {
  // 获取OpenClaw配置路径
  ipcMain.handle('get-config-path', async () => {
    return { path: getCurrentConfigPath() };
  });

  // 设置OpenClaw配置路径（不再保存到文件，仅内存中）
  ipcMain.handle('set-config-path', async (event, newPath) => {
    try {
      if (!newPath.endsWith('.json')) {
        return { success: false, error: '配置文件必须是 JSON 格式' };
      }

      return { success: true, path: newPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 读取OpenClaw配置文件内容
  ipcMain.handle('read-openclaw-config', async () => {
    try {
      const configPath = getCurrentConfigPath();
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        return { success: true, config: JSON.parse(content) };
      }
      return { success: true, config: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 保存OpenClaw配置文件
  ipcMain.handle('save-openclaw-config', async (event, config) => {
    try {
      const configPath = getCurrentConfigPath();
      const configDir = path.dirname(configPath);

      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      let finalConfig = config;
      if (fs.existsSync(configPath)) {
        try {
          const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          finalConfig = { ...existingConfig, ...config };
        } catch (e) {
          console.warn('Failed to read existing config:', e);
        }
      }

      fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2), 'utf-8');

      return { success: true, path: configPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 初始化OpenClaw配置文件
  ipcMain.handle('init-openclaw-config', async () => {
    try {
      const configPath = getCurrentConfigPath();
      const configDir = path.dirname(configPath);

      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      const defaultConfig = {
        models: {
          providers: {}
        },
        agents: {
          list: [],
          defaults: {}
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');

      return { success: true, configPath, message: '配置文件已初始化' };
    } catch (error) {
      console.error('Error in init-openclaw-config:', error);
      return { success: false, error: error.message };
    }
  });

  // DEBUG 模式相关接口
  ipcMain.handle('get-debug-status', async () => {
    return { enabled: isDebugEnabled() };
  });

  ipcMain.handle('set-debug-status', async (event, enabled) => {
    try {
      return { success: true, enabled, configPath: getCurrentConfigPath() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('toggle-debug', async () => {
    try {
      return { success: true, enabled: isDebugEnabled(), configPath: getCurrentConfigPath() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 列出所有备份
  ipcMain.handle('list-backups', async () => {
    try {
      const configPath = getCurrentConfigPath();
      const configDir = path.dirname(configPath);
      
      if (!fs.existsSync(configDir)) {
        return { success: true, backups: [] };
      }
      
      const files = fs.readdirSync(configDir);
      const backups = files
        .filter(file => file.startsWith('openclaw.json.') && file.endsWith('.backup'))
        .map(file => {
          const filePath = path.join(configDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            time: stats.mtime
          };
        })
        .sort((a, b) => b.time.getTime() - a.time.getTime());
      
      return { success: true, backups };
    } catch (error) {
      console.error('Error in list-backups:', error);
      return { success: false, error: error.message };
    }
  });

  // 保存原始配置并创建备份
  ipcMain.handle('save-raw-config', async (event, content) => {
    try {
      const configPath = getCurrentConfigPath();
      const configDir = path.dirname(configPath);
      
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // 创建备份
      if (fs.existsSync(configPath)) {
        const backupPath = `${configPath}.${Date.now()}.backup`;
        fs.copyFileSync(configPath, backupPath);
        console.log('Created backup:', backupPath);
      }
      
      // 保存新配置
      fs.writeFileSync(configPath, content, 'utf-8');
      
      return { success: true };
    } catch (error) {
      console.error('Error in save-raw-config:', error);
      return { success: false, error: error.message };
    }
  });

  // 从备份恢复
  ipcMain.handle('restore-backup', async (event, backupPath) => {
    try {
      const configPath = getCurrentConfigPath();
      
      if (!fs.existsSync(backupPath)) {
        return { success: false, error: '备份文件不存在' };
      }
      
      // 创建当前配置的备份
      if (fs.existsSync(configPath)) {
        const currentBackupPath = `${configPath}.${Date.now()}.backup`;
        fs.copyFileSync(configPath, currentBackupPath);
        console.log('Created backup of current config:', currentBackupPath);
      }
      
      // 从备份恢复
      fs.copyFileSync(backupPath, configPath);
      
      return { success: true };
    } catch (error) {
      console.error('Error in restore-backup:', error);
      return { success: false, error: error.message };
    }
  });
}
