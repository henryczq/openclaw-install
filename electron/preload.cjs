const { contextBridge, ipcRenderer } = require('electron');

console.log('Electron preload script loaded successfully');

let feishuInstallProgressHandler = null;
let feishuRpaProgressHandler = null;

ipcRenderer.on('feishu-rpa-progress', (event, progress) => {
  if (typeof feishuRpaProgressHandler === 'function') {
    feishuRpaProgressHandler(progress);
  }
});

ipcRenderer.on('install-feishu-progress', (event, output) => {
  if (typeof feishuInstallProgressHandler === 'function') {
    feishuInstallProgressHandler(output);
  }
});

const safeInvoke = async (channel, ...args) => {
  try {
    const result = await ipcRenderer.invoke(channel, ...args);
    if (result === undefined) {
      return { success: true };
    }
    if (result === null) {
      return { success: true };
    }
    if (typeof result !== 'object') {
      return { success: true, value: result };
    }
    return JSON.parse(JSON.stringify(result));
  } catch (err) {
    // 返回可序列化的错误对象
    return {
      success: false,
      error: err && err.message ? String(err.message) : String(err)
    };
  }
};

// 暴露API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 命令执行
  executeCommand: (command, options) => ipcRenderer.invoke('execute-command', command, options),

  // 环境检查
  checkNode: () => ipcRenderer.invoke('check-node'),
  checkNpm: () => ipcRenderer.invoke('check-npm'),
  checkGit: () => ipcRenderer.invoke('check-git'),
  checkOpenClaw: (strictMode) => ipcRenderer.invoke('check-openclaw', strictMode),
  checkVCRedist: () => ipcRenderer.invoke('check-vcredist'),

  // 配置
  setNpmRegistry: () => ipcRenderer.invoke('set-npm-registry'),
  configGitProxy: () => ipcRenderer.invoke('config-git-proxy'),

  // 文件操作
  downloadFile: (url, destPath) => ipcRenderer.invoke('download-file', url, destPath),
  downloadFileWithProgress: (url, destPath) => {
    const listener = (event, progress) => {
      if (window.onDownloadProgress) {
        window.onDownloadProgress(progress);
      }
    };
    ipcRenderer.on('download-progress', listener);
    return ipcRenderer.invoke('download-file-with-progress', url, destPath).finally(() => {
      ipcRenderer.removeListener('download-progress', listener);
    });
  },

  // 系统操作
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // OpenClaw操作
  installOpenClaw: (options) => ipcRenderer.invoke('install-openclaw', options),
  saveOpenClawConfig: (config) => ipcRenderer.invoke('save-openclaw-config', config),
  startOpenClawGateway: () => ipcRenderer.invoke('start-openclaw-gateway'),
  checkPort: (port) => ipcRenderer.invoke('check-port', port),
  configOpenClawAI: (model, apiKey) => ipcRenderer.invoke('config-openclaw-ai', model, apiKey),
  initOpenClawConfig: () => ipcRenderer.invoke('init-openclaw-config'),
  getVolcengineApiKey: () => ipcRenderer.invoke('get-volcengine-apikey'),
  fetchVolcengineApiKey: () => ipcRenderer.invoke('fetch-volcengine-apikey'),
  getKimiApiKey: () => ipcRenderer.invoke('get-kimi-apikey'),
  getConfigPath: () => ipcRenderer.invoke('get-config-path'),
  setConfigPath: (path) => ipcRenderer.invoke('set-config-path', path),
  readOpenClawConfig: () => ipcRenderer.invoke('read-openclaw-config'),
  testAIConnection: (params) => ipcRenderer.invoke('test-ai-connection', params),
  getAIConfig: () => ipcRenderer.invoke('get-ai-config'),
  saveAIConfig: (params) => ipcRenderer.invoke('save-ai-config', params),
  listBackups: () => ipcRenderer.invoke('list-backups'),
  restoreBackup: (backupPath) => ipcRenderer.invoke('restore-backup', backupPath),
  saveRawConfig: (content) => ipcRenderer.invoke('save-raw-config', content),
  checkFeishuPlugin: () => ipcRenderer.invoke('check-feishu-plugin'),
  setFeishuInstallProgressHandler: (handler) => {
    feishuInstallProgressHandler = typeof handler === 'function' ? handler : null;
  },
  clearFeishuInstallProgressHandler: () => {
    feishuInstallProgressHandler = null;
  },
  setFeishuRpaProgressHandler: (handler) => {
    feishuRpaProgressHandler = typeof handler === 'function' ? handler : null;
  },
  clearFeishuRpaProgressHandler: () => {
    feishuRpaProgressHandler = null;
  },
  
  // 飞书 RPA 相关
  feishuLogin: () => safeInvoke('feishu-login'),
  feishuCreateApp: (params) => safeInvoke('feishu-create-app', params),
  feishuConfigPermissions: () => safeInvoke('feishu-config-permissions'),
  feishuPublishVersion: () => safeInvoke('feishu-publish-version'),
  feishuSubscribeEvents: () => safeInvoke('feishu-subscribe-events'),
  feishuGetCredentials: () => safeInvoke('feishu-get-credentials'),
  
  openFeishuConsole: () => {
    console.log('Invoking open-feishu-console');
    return safeInvoke('open-feishu-console');
  },
  installFeishuPlugin: () => safeInvoke('install-feishu-plugin'),
  configFeishuChannel: (appId, appSecret) => ipcRenderer.invoke('config-feishu-channel', appId, appSecret),
  checkQqPlugin: () => ipcRenderer.invoke('check-qq-plugin'),
  installQqPlugin: () => ipcRenderer.invoke('install-qq-plugin'),
  openQqConsole: () => ipcRenderer.invoke('open-qq-console'),
  qqCheckLogin: () => ipcRenderer.invoke('qq-check-login'),
  qqCreateRobot: () => ipcRenderer.invoke('qq-create-robot'),
  qqGetCredentials: () => ipcRenderer.invoke('qq-get-credentials'),
  configQqChannel: (appId, appSecret) => ipcRenderer.invoke('config-qq-channel', appId, appSecret),
  restartOpenClaw: () => ipcRenderer.invoke('restart-openclaw'),
  startOpenClawGateway: () => ipcRenderer.invoke('start-openclaw-gateway'),
  stopOpenClawGateway: () => ipcRenderer.invoke('stop-openclaw-gateway'),
  restartOpenClawGateway: () => ipcRenderer.invoke('restart-openclaw-gateway'),
  checkGatewayStatus: (port) => ipcRenderer.invoke('check-gateway-status', port),
  uninstallOpenClaw: () => ipcRenderer.invoke('uninstall-openclaw'),
  detectOpenClawResidue: () => ipcRenderer.invoke('detect-openclaw-residue'),
  cleanupOpenClawResidue: () => ipcRenderer.invoke('cleanup-openclaw-residue'),
  removeOpenClawResidueItem: (selector) => ipcRenderer.invoke('remove-openclaw-residue-item', selector),
  restartApp: (options) => ipcRenderer.invoke('restart-app', options),
  checkContinueInstall: () => ipcRenderer.invoke('check-continue-install'),
  clearContinueInstall: () => ipcRenderer.invoke('clear-continue-install'),
  getDebugStatus: () => ipcRenderer.invoke('get-debug-status'),
  setDebugStatus: (enabled) => ipcRenderer.invoke('set-debug-status', enabled),
  toggleDebug: () => ipcRenderer.invoke('toggle-debug'),
  
  // 模型管理
  listProviders: () => ipcRenderer.invoke('list-providers'),
  listModels: () => ipcRenderer.invoke('list-models'),
  getDefaultModel: () => ipcRenderer.invoke('get-default-model'),
  setDefaultModel: (providerId, modelId) => ipcRenderer.invoke('set-default-model', providerId, modelId),
  deleteModel: (providerId, modelId, autoDeleteProvider) => ipcRenderer.invoke('delete-model', providerId, modelId, autoDeleteProvider),
  deleteProvider: (providerId) => ipcRenderer.invoke('delete-provider', providerId),
  updateModel: (params) => ipcRenderer.invoke('update-model', params),
});
