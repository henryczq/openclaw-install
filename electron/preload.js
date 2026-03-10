import { contextBridge, ipcRenderer } from 'electron';

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

contextBridge.exposeInMainWorld('electronAPI', {
  executeCommand: (command, options) => ipcRenderer.invoke('execute-command', command, options),
  checkNode: () => ipcRenderer.invoke('check-node'),
  checkNpm: () => ipcRenderer.invoke('check-npm'),
  checkGit: () => ipcRenderer.invoke('check-git'),
  checkOpenClaw: () => ipcRenderer.invoke('check-openclaw'),
  setNpmRegistry: () => ipcRenderer.invoke('set-npm-registry'),
  configGitProxy: () => ipcRenderer.invoke('config-git-proxy'),
  downloadFile: (url, destPath) => ipcRenderer.invoke('download-file', url, destPath),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  installOpenClaw: () => ipcRenderer.invoke('install-openclaw'),
  openclawOnboard: () => ipcRenderer.invoke('openclaw-onboard'),
  configOpenClawAI: (model, apiKey) => ipcRenderer.invoke('config-openclaw-ai', model, apiKey),
  getVolcengineApiKey: () => ipcRenderer.invoke('get-volcengine-apikey'),
  fetchVolcengineApiKey: () => ipcRenderer.invoke('fetch-volcengine-apikey'),
  getKimiApiKey: () => ipcRenderer.invoke('get-kimi-apikey'),
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
  feishuLogin: () => ipcRenderer.invoke('feishu-login'),
  feishuCreateApp: (params) => ipcRenderer.invoke('feishu-create-app', params),
  feishuConfigPermissions: () => ipcRenderer.invoke('feishu-config-permissions'),
  feishuPublishVersion: () => ipcRenderer.invoke('feishu-publish-version'),
  feishuSubscribeEvents: () => ipcRenderer.invoke('feishu-subscribe-events'),
  feishuGetCredentials: () => ipcRenderer.invoke('feishu-get-credentials'),
  openFeishuConsole: () => ipcRenderer.invoke('open-feishu-console'),
  installFeishuPlugin: () => ipcRenderer.invoke('install-feishu-plugin'),
  configFeishuChannel: (appId, appSecret) => ipcRenderer.invoke('config-feishu-channel', appId, appSecret),
  checkQqPlugin: () => ipcRenderer.invoke('check-qq-plugin'),
  installQqPlugin: () => ipcRenderer.invoke('install-qq-plugin'),
  openQqConsole: () => ipcRenderer.invoke('open-qq-console'),
  qqCreateRobot: () => ipcRenderer.invoke('qq-create-robot'),
  qqGetCredentials: () => ipcRenderer.invoke('qq-get-credentials'),
  configQqChannel: (appId, appSecret) => ipcRenderer.invoke('config-qq-channel', appId, appSecret),
  restartOpenClaw: () => ipcRenderer.invoke('restart-openclaw'),
  uninstallOpenClaw: () => ipcRenderer.invoke('uninstall-openclaw'),
  getDebugStatus: () => ipcRenderer.invoke('get-debug-status'),
  setDebugStatus: (enabled) => ipcRenderer.invoke('set-debug-status', enabled),
  toggleDebug: () => ipcRenderer.invoke('toggle-debug'),
});
