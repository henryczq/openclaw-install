// 配置管理相关 IPC 处理程序
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { isDebugEnabled, getCurrentConfigPath } from '../config/debug-config.js';
import {
  listProviders,
  listModels,
  getDefaultModel,
  setDefaultModel,
  deleteModel,
  deleteProvider,
  updateModel,
} from '../utils/openclaw-model-manager.js';

// 生成随机 token
function generateRandomToken(length = 40) {
  return crypto.randomBytes(length).toString('hex');
}

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

      const now = new Date().toISOString();
      const defaultConfig = {
        wizard: {
          lastRunAt: now,
          lastRunVersion: '2026.3.8',
          lastRunCommand: 'onboard',
          lastRunMode: 'local'
        },
        agents: {
          defaults: {
            model: {
              primary: 'henryczq/zzgz'
            },
            models: {
              'henryczq/zzgz': {}
            },
            workspace: '~\\.openclaw\\workspace',
            compaction: {
              mode: 'safeguard'
            },
            maxConcurrent: 4,
            subagents: {
              maxConcurrent: 8
            }
          }
        },
        tools: {
          profile: 'coding'
        },
        messages: {
          ackReactionScope: 'group-mentions'
        },
        commands: {
          native: 'auto',
          nativeSkills: 'auto',
          restart: true,
          ownerDisplay: 'raw'
        },
        session: {
          dmScope: 'per-channel-peer'
        },
        hooks: {
          internal: {
            enabled: true,
            entries: {
              'boot-md': {
                enabled: true
              }
            }
          }
        },
        gateway: {
          port: 18789,
          mode: 'local',
          bind: 'loopback',
          auth: {
            mode: 'token',
            token: generateRandomToken(48)
          },
          tailscale: {
            mode: 'off',
            resetOnExit: false
          },
          nodes: {
            denyCommands: [
              'camera.snap',
              'camera.clip',
              'screen.record',
              'contacts.add',
              'calendar.add',
              'reminders.add',
              'sms.send'
            ]
          }
        },
        meta: {
          lastTouchedVersion: '2026.3.8',
          lastTouchedAt: now
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
      console.log('[Config] list-backups - configPath:', configPath);
      
      const configDir = path.dirname(configPath);
      console.log('[Config] list-backups - configDir:', configDir);
      
      if (!fs.existsSync(configDir)) {
        console.log('[Config] list-backups - 目录不存在，返回空列表');
        return { success: true, backups: [] };
      }
      
      // 获取配置文件的基本名称（例如：openclaw-test.json 或 openclaw.json）
      const configBaseName = path.basename(configPath);
      console.log('[Config] list-backups - configBaseName:', configBaseName);
      
      const files = fs.readdirSync(configDir);
      console.log('[Config] list-backups - 目录中的所有文件:', files);
      
      // 过滤出当前配置的备份文件（格式：{configBaseName}.{timestamp}.backup）
      const backups = files
        .filter(file => file.startsWith(configBaseName + '.') && file.endsWith('.backup'))
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
      
      console.log('[Config] list-backups - 找到的备份:', backups);
      return { success: true, backups };
    } catch (error) {
      console.error('[Config] Error in list-backups:', error);
      return { success: false, error: error.message };
    }
  });

  // 保存原始配置并创建备份
  ipcMain.handle('save-raw-config', async (event, content) => {
    try {
      const configPath = getCurrentConfigPath();
      console.log('[Config] save-raw-config - configPath:', configPath);
      
      const configDir = path.dirname(configPath);
      console.log('[Config] save-raw-config - configDir:', configDir);
      
      if (!fs.existsSync(configDir)) {
        console.log('[Config] save-raw-config - 目录不存在，创建目录');
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // 创建备份
      if (fs.existsSync(configPath)) {
        const backupPath = `${configPath}.${Date.now()}.backup`;
        fs.copyFileSync(configPath, backupPath);
        console.log('[Config] save-raw-config - 已创建备份:', backupPath);
      } else {
        console.log('[Config] save-raw-config - 配置文件不存在，跳过备份');
      }
      
      // 保存新配置
      fs.writeFileSync(configPath, content, 'utf-8');
      console.log('[Config] save-raw-config - 配置已保存到:', configPath);
      
      return { success: true };
    } catch (error) {
      console.error('[Config] Error in save-raw-config:', error);
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

  // 模型管理 IPC 处理程序
  // 列出所有 Providers
  ipcMain.handle('list-providers', async () => {
    try {
      const providers = listProviders();
      return { success: true, providers };
    } catch (error) {
      console.error('Error in list-providers:', error);
      return { success: false, error: error.message };
    }
  });

  // 列出所有 Models
  ipcMain.handle('list-models', async () => {
    try {
      const models = listModels();
      return { success: true, models };
    } catch (error) {
      console.error('Error in list-models:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取默认模型
  ipcMain.handle('get-default-model', async () => {
    try {
      const model = getDefaultModel();
      return { success: true, model };
    } catch (error) {
      console.error('Error in get-default-model:', error);
      return { success: false, error: error.message };
    }
  });

  // 设置默认模型
  ipcMain.handle('set-default-model', async (event, providerId, modelId) => {
    try {
      const result = setDefaultModel(providerId, modelId);
      return { success: result.success, message: result.message };
    } catch (error) {
      console.error('Error in set-default-model:', error);
      return { success: false, error: error.message };
    }
  });

  // 删除模型
  ipcMain.handle('delete-model', async (event, providerId, modelId, autoDeleteProvider = false) => {
    try {
      const result = deleteModel(providerId, modelId, autoDeleteProvider);
      return {
        success: result.success,
        message: result.message,
        providerDeleted: result.providerDeleted,
        providerEmpty: result.providerEmpty,
      };
    } catch (error) {
      console.error('Error in delete-model:', error);
      return { success: false, error: error.message };
    }
  });

  // 删除 Provider
  ipcMain.handle('delete-provider', async (event, providerId) => {
    try {
      const result = deleteProvider(providerId);
      return { success: result.success, message: result.message };
    } catch (error) {
      console.error('Error in delete-provider:', error);
      return { success: false, error: error.message };
    }
  });

  // 更新模型
  ipcMain.handle('update-model', async (event, params) => {
    try {
      const result = updateModel(params);
      return {
        success: result.success,
        message: result.message,
        fullName: result.fullName,
      };
    } catch (error) {
      console.error('Error in update-model:', error);
      return { success: false, error: error.message };
    }
  });
}
