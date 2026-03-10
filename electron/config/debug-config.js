// DEBUG 配置管理
import { app } from 'electron';
import path from 'path';

// 获取 DEBUG 状态 - 运行时动态判断
export function isDebugEnabled() {
  // 如果是打包后的应用，强制返回 false（正式环境）
  if (app.isPackaged) {
    return false;
  }
  
  // 开发环境：从环境变量读取
  const envValue = process.env.OPENCLAW_DEBUG_ENABLED;
  if (envValue !== undefined) {
    return envValue === 'true';
  }
  return true; // 开发环境默认开启
}

// 获取环境变量配置的路径
function getEnvConfigPath() {
  // 如果是打包后的应用，强制使用正式配置
  if (app.isPackaged) {
    return '~\\.openclaw\\openclaw.json';
  }
  
  // 开发环境：从环境变量读取
  return process.env.OPENCLAW_CONFIG_PATH || '~\\.openclaw\\openclaw-test.json';
}

// 获取当前配置路径 - 运行时动态判断
export function getCurrentConfigPath() {
  const homeDir = process.env.USERPROFILE || process.env.HOME;
  const openclawDir = path.join(homeDir, '.openclaw');

  // 优先使用环境变量配置的路径
  const envPath = getEnvConfigPath();
  if (envPath && envPath !== '~\\.openclaw\\openclaw.json') {
    // 解析 ~ 为 home 目录
    if (envPath.startsWith('~\\') || envPath.startsWith('~/')) {
      return path.join(homeDir, envPath.slice(2));
    }
    return envPath;
  }

  // 根据 DEBUG 状态选择配置
  if (isDebugEnabled()) {
    return path.join(openclawDir, 'openclaw-test.json');
  }
  return path.join(openclawDir, 'openclaw.json');
}
