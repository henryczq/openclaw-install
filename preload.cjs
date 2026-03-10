const { contextBridge, ipcRenderer } = require('electron');

console.log('Electron preload script loaded successfully');

ipcRenderer.on('feishu-rpa-progress', (event, progress) => {
  if (window.onFeishuRpaProgress) {
    window.onFeishuRpaProgress(progress);
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
  checkOpenClaw: () => ipcRenderer.invoke('check-openclaw'),

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
  installOpenClaw: () => ipcRenderer.invoke('install-openclaw'),
  openclawOnboard: () => ipcRenderer.invoke('openclaw-onboard'),
  saveOpenClawConfig: (config) => ipcRenderer.invoke('save-openclaw-config', config),
  startOpenClawGateway: () => ipcRenderer.invoke('start-openclaw-gateway'),
  checkPort: (port) => ipcRenderer.invoke('check-port', port),
  configOpenClawAI: (model, apiKey) => ipcRenderer.invoke('config-openclaw-ai', model, apiKey),
  initOpenClawConfig: () => ipcRenderer.invoke('init-openclaw-config'),
  getVolcengineApiKey: () => ipcRenderer.invoke('get-volcengine-apikey'),
  getConfigPath: () => ipcRenderer.invoke('get-config-path'),
  setConfigPath: (path) => ipcRenderer.invoke('set-config-path', path),
  readOpenClawConfig: () => ipcRenderer.invoke('read-openclaw-config'),
  testAIConnection: (params) => ipcRenderer.invoke('test-ai-connection', params),
  listBackups: () => ipcRenderer.invoke('list-backups'),
  restoreBackup: (backupPath) => ipcRenderer.invoke('restore-backup', backupPath),
  saveRawConfig: (content) => ipcRenderer.invoke('save-raw-config', content),
  checkFeishuPlugin: () => ipcRenderer.invoke('check-feishu-plugin'),
  
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
  installFeishuPlugin: () => {
    const listener = (event, output) => {
      if (window.onFeishuInstallProgress) {
        window.onFeishuInstallProgress(output);
      }
    };
    ipcRenderer.on('install-feishu-progress', listener);
    return ipcRenderer.invoke('install-feishu-plugin').finally(() => {
      ipcRenderer.removeListener('install-feishu-progress', listener);
    });
  },
  configFeishuChannel: (appId, appSecret) => ipcRenderer.invoke('config-feishu-channel', appId, appSecret),
  restartOpenClaw: () => ipcRenderer.invoke('restart-openclaw'),
  uninstallOpenClaw: () => ipcRenderer.invoke('uninstall-openclaw'),
});
