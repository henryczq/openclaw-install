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
  checkOpenClaw: (strictMode) => ipcRenderer.invoke('check-openclaw', strictMode),
  setNpmRegistry: () => ipcRenderer.invoke('set-npm-registry'),
  configGitProxy: () => ipcRenderer.invoke('config-git-proxy'),
  downloadFile: (url, destPath) => ipcRenderer.invoke('download-file', url, destPath),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  installOpenClaw: () => ipcRenderer.invoke('install-openclaw'),
  saveOpenClawConfig: (config) => ipcRenderer.invoke('save-openclaw-config', config),
  initOpenClawConfig: () => ipcRenderer.invoke('init-openclaw-config'),
  getConfigPath: () => ipcRenderer.invoke('get-config-path'),
  setConfigPath: (path) => ipcRenderer.invoke('set-config-path', path),
  readOpenClawConfig: () => ipcRenderer.invoke('read-openclaw-config'),
  testAIConnection: (params) => ipcRenderer.invoke('test-ai-connection', params),
  configOpenClawAI: (model, apiKey) => ipcRenderer.invoke('config-openclaw-ai', model, apiKey),
  getAIConfig: () => ipcRenderer.invoke('get-ai-config'),
  saveAIConfig: (params) => ipcRenderer.invoke('save-ai-config', params),
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
  startOpenClawGateway: () => ipcRenderer.invoke('start-openclaw-gateway'),
  stopOpenClawGateway: () => ipcRenderer.invoke('stop-openclaw-gateway'),
  restartOpenClawGateway: () => ipcRenderer.invoke('restart-openclaw-gateway'),
  checkGatewayStatus: (port) => ipcRenderer.invoke('check-gateway-status', port),
  uninstallOpenClaw: () => ipcRenderer.invoke('uninstall-openclaw'),
  detectOpenClawResidue: () => ipcRenderer.invoke('detect-openclaw-residue'),
  cleanupOpenClawResidue: () => ipcRenderer.invoke('cleanup-openclaw-residue'),
  removeOpenClawResidueItem: (selector) => ipcRenderer.invoke('remove-openclaw-residue-item', selector),
  listBackups: () => ipcRenderer.invoke('list-backups'),
  restoreBackup: (backupPath) => ipcRenderer.invoke('restore-backup', backupPath),
  checkContinueInstall: () => ipcRenderer.invoke('check-continue-install'),
  clearContinueInstall: () => ipcRenderer.invoke('clear-continue-install'),
  listModels: () => ipcRenderer.invoke('list-models'),
  getDefaultModel: () => ipcRenderer.invoke('get-default-model'),
  setDefaultModel: (providerId, modelId) => ipcRenderer.invoke('set-default-model', providerId, modelId),
  getDebugStatus: () => ipcRenderer.invoke('get-debug-status'),
  setDebugStatus: (enabled) => ipcRenderer.invoke('set-debug-status', enabled),
  toggleDebug: () => ipcRenderer.invoke('toggle-debug'),
});
