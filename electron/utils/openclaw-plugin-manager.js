import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * 获取 OpenClaw 配置目录
 * 优先级：OPENCLAW_STATE_DIR > OPENCLAW_HOME/.openclaw > ~/.openclaw
 */
function getOpenClawDir() {
  if (process.env.OPENCLAW_STATE_DIR) {
    return process.env.OPENCLAW_STATE_DIR;
  }
  if (process.env.OPENCLAW_HOME) {
    return path.join(process.env.OPENCLAW_HOME, '.openclaw');
  }
  return path.join(os.homedir(), '.openclaw');
}

/**
 * 获取当前配置路径
 * 优先级：OPENCLAW_CONFIG_PATH > {openclawDir}/openclaw.json
 */
function getConfigPath() {
  if (process.env.OPENCLAW_CONFIG_PATH) {
    return process.env.OPENCLAW_CONFIG_PATH;
  }
  return path.join(getOpenClawDir(), 'openclaw.json');
}

/**
 * 获取插件安装目录
 * 默认：~/.openclaw/extensions/
 */
function getPluginsInstallDir() {
  return path.join(getOpenClawDir(), 'extensions');
}

/**
 * 读取 OpenClaw 配置文件
 */
function readConfig() {
  try {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
      return {};
    }
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * 检查文件是否可写
 */
function checkWritable() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      try {
        fs.accessSync(configPath, fs.constants.W_OK);
      } catch {
        return { writable: false, message: '配置文件为只读，无法修改。请检查文件权限或以管理员身份运行。' };
      }
    }
    const dir = path.dirname(configPath);
    if (fs.existsSync(dir)) {
      try {
        fs.accessSync(dir, fs.constants.W_OK);
      } catch {
        return { writable: false, message: '配置目录为只读，无法修改。请检查目录权限或以管理员身份运行。' };
      }
    }
    return { writable: true };
  } catch (error) {
    return { writable: false, message: `权限检查失败: ${error.message}` };
  }
}

/**
 * 写入 OpenClaw 配置文件
 */
function writeConfig(config) {
  const check = checkWritable();
  if (!check.writable) {
    return { success: false, message: check.message };
  }

  try {
    const configPath = getConfigPath();
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, message: `写入失败: ${error.message}` };
  }
}

/**
 * 扫描已安装的插件包
 * 从 ~/.openclaw/extensions/ 目录扫描
 * @returns {Array} 已安装的插件列表
 */
function scanInstalledPlugins() {
  const pluginsDir = getPluginsInstallDir();
  const installed = [];

  if (!fs.existsSync(pluginsDir)) {
    return installed;
  }

  try {
    const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const pluginId = entry.name;
      const pluginPath = path.join(pluginsDir, pluginId);
      const packageJsonPath = path.join(pluginPath, 'package.json');

      let name = pluginId;
      let version = 'unknown';
      let description = '';

      // 读取 package.json
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          name = packageJson.name || pluginId;
          version = packageJson.version || 'unknown';
          description = packageJson.description || '';
        } catch {
          // 忽略解析错误
        }
      }

      installed.push({
        pluginId,
        name,
        version,
        description,
        installPath: pluginPath,
        hasPackageJson: fs.existsSync(packageJsonPath),
      });
    }
  } catch (error) {
    console.error('扫描插件目录失败:', error.message);
  }

  return installed;
}

/**
 * 获取插件状态
 * @param {string} pluginId 插件ID
 * @param {Object} pluginsConfig 插件配置
 * @param {boolean} isInstalled 是否已安装
 * @returns {Object} 插件状态信息
 */
function getPluginStatus(pluginId, pluginsConfig, isInstalled = false) {
  const entries = pluginsConfig.entries || {};
  const installs = pluginsConfig.installs || {};
  const allow = pluginsConfig.allow || [];
  const deny = pluginsConfig.deny || [];

  const entry = entries[pluginId];
  const install = installs[pluginId];

  // 判断是否被允许
  const isAllowed = allow.includes(pluginId) || allow.includes('*');
  const isDenied = deny.includes(pluginId);

  // 确定状态
  let status = 'not_installed';
  if (isDenied) {
    status = 'blocked';
  } else if (entry?.enabled === true && isAllowed) {
    status = 'enabled';
  } else if (entry?.enabled === false) {
    status = 'disabled';
  } else if (isInstalled || install) {
    status = 'installed';
  }

  return {
    pluginId,
    status,
    isAllowed,
    isDenied,
    enabled: entry?.enabled ?? false,
    hasInstall: !!install || isInstalled,
    hasEntry: !!entry,
  };
}

/**
 * 列出所有插件
 * 合并配置文件中的插件和实际安装的插件
 * @returns {Array} 插件列表
 */
export function listPlugins() {
  const config = readConfig();
  const pluginsConfig = config.plugins || {};

  // 扫描实际安装的插件
  const installedPlugins = scanInstalledPlugins();
  const installedMap = new Map(installedPlugins.map(p => [p.pluginId, p]));

  const result = [];
  const processed = new Set();

  // 处理已安装的插件（从文件系统扫描）
  for (const installed of installedPlugins) {
    processed.add(installed.pluginId);
    const status = getPluginStatus(installed.pluginId, pluginsConfig, true);
    const installRecord = pluginsConfig.installs?.[installed.pluginId];

    result.push({
      pluginId: installed.pluginId,
      name: installRecord?.resolvedName || installed.name,
      version: installRecord?.version || installRecord?.resolvedVersion || installed.version,
      description: installed.description,
      status: status.status,
      enabled: status.enabled,
      isAllowed: status.isAllowed,
      isDenied: status.isDenied,
      // 安装信息
      installInfo: {
        source: installRecord?.source, // npm/archive/path
        spec: installRecord?.spec,
        installPath: installed.installPath,
        version: installRecord?.version || installed.version,
        resolvedName: installRecord?.resolvedName || installed.name,
        resolvedVersion: installRecord?.resolvedVersion,
        integrity: installRecord?.integrity,
        resolvedAt: installRecord?.resolvedAt,
        installedAt: installRecord?.installedAt,
      },
      // 入口配置
      entry: pluginsConfig.entries?.[installed.pluginId] || null,
    });
  }

  // 处理配置中有记录但未安装的插件
  const installs = pluginsConfig.installs || {};
  for (const [pluginId, installInfo] of Object.entries(installs)) {
    if (processed.has(pluginId)) continue;
    processed.add(pluginId);

    const status = getPluginStatus(pluginId, pluginsConfig, false);

    result.push({
      pluginId,
      name: installInfo.resolvedName || pluginId,
      version: installInfo.version || installInfo.resolvedVersion || 'unknown',
      description: '',
      status: status.status,
      enabled: status.enabled,
      isAllowed: status.isAllowed,
      isDenied: status.isDenied,
      installInfo: {
        source: installInfo.source,
        spec: installInfo.spec,
        installPath: installInfo.installPath,
        version: installInfo.version,
        resolvedName: installInfo.resolvedName,
        resolvedVersion: installInfo.resolvedVersion,
        integrity: installInfo.integrity,
        resolvedAt: installInfo.resolvedAt,
        installedAt: installInfo.installedAt,
      },
      entry: pluginsConfig.entries?.[pluginId] || null,
      notInstalled: true, // 标记为未实际安装
    });
  }

  // 处理有入口但未安装的插件（手动配置）
  const entries = pluginsConfig.entries || {};
  for (const [pluginId, entry] of Object.entries(entries)) {
    if (processed.has(pluginId)) continue;

    const status = getPluginStatus(pluginId, pluginsConfig, false);
    result.push({
      pluginId,
      name: pluginId,
      version: entry.version || 'unknown',
      description: '',
      status: status.status,
      enabled: status.enabled,
      isAllowed: status.isAllowed,
      isDenied: status.isDenied,
      installInfo: null,
      entry,
    });
  }

  // 处理允许列表中但未配置的插件
  const allow = pluginsConfig.allow || [];
  for (const pluginId of allow) {
    if (processed.has(pluginId) || pluginId === '*') continue;

    result.push({
      pluginId,
      name: pluginId,
      version: 'unknown',
      description: '',
      status: 'allowed',
      enabled: false,
      isAllowed: true,
      isDenied: false,
      installInfo: null,
      entry: null,
    });
  }

  return result;
}

/**
 * 获取单个插件详情
 * @param {string} pluginId 插件ID
 * @returns {Object|null} 插件详情
 */
export function getPlugin(pluginId) {
  const plugins = listPlugins();
  return plugins.find(p => p.pluginId === pluginId) || null;
}

/**
 * 启用插件
 * @param {string} pluginId 插件ID
 * @returns {Object} 操作结果
 */
export function enablePlugin(pluginId) {
  const config = readConfig();

  if (!config.plugins) {
    config.plugins = {};
  }

  // 确保 entries 存在
  if (!config.plugins.entries) {
    config.plugins.entries = {};
  }

  // 设置插件为启用状态
  if (!config.plugins.entries[pluginId]) {
    config.plugins.entries[pluginId] = {};
  }
  config.plugins.entries[pluginId].enabled = true;

  // 确保在 allow 列表中
  if (!config.plugins.allow) {
    config.plugins.allow = [];
  }
  if (!config.plugins.allow.includes(pluginId)) {
    config.plugins.allow.push(pluginId);
  }

  // 从 deny 列表中移除
  if (config.plugins.deny) {
    config.plugins.deny = config.plugins.deny.filter(id => id !== pluginId);
  }

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `插件 ${pluginId} 已启用`,
    pluginId,
    enabled: true,
  };
}

/**
 * 禁用插件
 * @param {string} pluginId 插件ID
 * @returns {Object} 操作结果
 */
export function disablePlugin(pluginId) {
  const config = readConfig();

  if (!config.plugins?.entries?.[pluginId]) {
    return { success: false, message: `插件 ${pluginId} 未配置` };
  }

  // 设置插件为禁用状态
  config.plugins.entries[pluginId].enabled = false;

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `插件 ${pluginId} 已禁用`,
    pluginId,
    enabled: false,
  };
}

/**
 * 删除插件（包括配置文件和安装包）
 * @param {string} pluginId 插件ID
 * @param {boolean} [removeFiles=true] 是否删除插件文件（默认true）
 * @returns {Object} 操作结果
 */
export function removePlugin(pluginId, removeFiles = true) {
  const config = readConfig();
  const pluginsDir = getPluginsInstallDir();
  const pluginInstallPath = path.join(pluginsDir, pluginId);

  // 检查插件是否实际安装
  const isInstalled = fs.existsSync(pluginInstallPath);

  // 从 entries 中移除
  if (config.plugins?.entries?.[pluginId]) {
    delete config.plugins.entries[pluginId];
  }

  // 从 installs 中移除
  if (config.plugins?.installs?.[pluginId]) {
    delete config.plugins.installs[pluginId];
  }

  // 从 allow 列表中移除
  if (config.plugins?.allow) {
    config.plugins.allow = config.plugins.allow.filter(id => id !== pluginId);
  }

  // 从 deny 列表中移除
  if (config.plugins?.deny) {
    config.plugins.deny = config.plugins.deny.filter(id => id !== pluginId);
  }

  // 写入配置
  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  // 删除插件文件
  let filesRemoved = false;
  let filesRemoveError = null;

  if (removeFiles && isInstalled) {
    try {
      fs.rmSync(pluginInstallPath, { recursive: true, force: true });
      filesRemoved = true;
    } catch (error) {
      filesRemoveError = error.message;
    }
  }

  // 构建返回消息
  let message = `插件 ${pluginId} 已从配置中移除`;
  if (removeFiles) {
    if (isInstalled && filesRemoved) {
      message = `插件 ${pluginId} 已完全删除（配置和安装包）`;
    } else if (isInstalled && !filesRemoved) {
      message = `插件 ${pluginId} 配置已删除，但安装包删除失败: ${filesRemoveError}`;
    } else if (!isInstalled) {
      message = `插件 ${pluginId} 配置已删除（未找到安装包）`;
    }
  }

  return {
    success: true,
    message,
    pluginId,
    configRemoved: true,
    filesRemoved: isInstalled && filesRemoved,
    wasInstalled: isInstalled,
    installPath: pluginInstallPath,
    filesRemoveError,
  };
}

/**
 * 仅删除插件安装包，保留配置
 * @param {string} pluginId 插件ID
 * @returns {Object} 操作结果
 */
export function removePluginFilesOnly(pluginId) {
  const pluginsDir = getPluginsInstallDir();
  const pluginInstallPath = path.join(pluginsDir, pluginId);

  if (!fs.existsSync(pluginInstallPath)) {
    return {
      success: false,
      message: `插件 ${pluginId} 的安装包不存在`,
      pluginId,
    };
  }

  try {
    fs.rmSync(pluginInstallPath, { recursive: true, force: true });
    return {
      success: true,
      message: `插件 ${pluginId} 的安装包已删除`,
      pluginId,
      installPath: pluginInstallPath,
    };
  } catch (error) {
    return {
      success: false,
      message: `删除插件 ${pluginId} 安装包失败: ${error.message}`,
      pluginId,
      installPath: pluginInstallPath,
      error: error.message,
    };
  }
}

/**
 * 添加插件到允许列表
 * @param {string} pluginId 插件ID
 * @returns {Object} 操作结果
 */
export function allowPlugin(pluginId) {
  const config = readConfig();

  if (!config.plugins) {
    config.plugins = {};
  }

  if (!config.plugins.allow) {
    config.plugins.allow = [];
  }

  if (!config.plugins.allow.includes(pluginId)) {
    config.plugins.allow.push(pluginId);
  }

  // 从 deny 列表中移除
  if (config.plugins.deny) {
    config.plugins.deny = config.plugins.deny.filter(id => id !== pluginId);
  }

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `插件 ${pluginId} 已添加到允许列表`,
    pluginId,
  };
}

/**
 * 添加插件到拒绝列表
 * @param {string} pluginId 插件ID
 * @returns {Object} 操作结果
 */
export function denyPlugin(pluginId) {
  const config = readConfig();

  if (!config.plugins) {
    config.plugins = {};
  }

  if (!config.plugins.deny) {
    config.plugins.deny = [];
  }

  if (!config.plugins.deny.includes(pluginId)) {
    config.plugins.deny.push(pluginId);
  }

  // 从 allow 列表中移除
  if (config.plugins.allow) {
    config.plugins.allow = config.plugins.allow.filter(id => id !== pluginId);
  }

  // 禁用该插件
  if (config.plugins.entries?.[pluginId]) {
    config.plugins.entries[pluginId].enabled = false;
  }

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `插件 ${pluginId} 已添加到拒绝列表`,
    pluginId,
  };
}

/**
 * 更新插件配置
 * @param {string} pluginId 插件ID
 * @param {Object} config 插件配置
 * @returns {Object} 操作结果
 */
export function setPluginConfig(pluginId, pluginConfig) {
  const config = readConfig();

  if (!config.plugins) {
    config.plugins = {};
  }

  if (!config.plugins.entries) {
    config.plugins.entries = {};
  }

  if (!config.plugins.entries[pluginId]) {
    config.plugins.entries[pluginId] = {};
  }

  config.plugins.entries[pluginId].config = pluginConfig;

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `插件 ${pluginId} 配置已更新`,
    pluginId,
  };
}

/**
 * 获取插件配置
 * @param {string} pluginId 插件ID
 * @returns {Object|null} 插件配置
 */
export function getPluginConfig(pluginId) {
  const config = readConfig();
  return config.plugins?.entries?.[pluginId]?.config || null;
}

/**
 * 获取插件统计信息
 * @returns {Object} 统计信息
 */
export function getPluginStats() {
  const plugins = listPlugins();

  return {
    total: plugins.length,
    enabled: plugins.filter(p => p.status === 'enabled').length,
    disabled: plugins.filter(p => p.status === 'disabled').length,
    blocked: plugins.filter(p => p.status === 'blocked').length,
    installed: plugins.filter(p => p.status === 'installed' || p.status === 'enabled' || p.status === 'disabled').length,
    notInstalled: plugins.filter(p => p.notInstalled).length,
  };
}

/**
 * 获取插件安装目录
 */
export function getPluginsInstallDirExport() {
  return getPluginsInstallDir();
}

/**
 * 获取配置路径
 */
export function getConfigPathExport() {
  return getConfigPath();
}

/**
 * 获取 OpenClaw 配置目录
 */
export function getOpenClawDirExport() {
  return getOpenClawDir();
}
