export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  tempPath: string;
}

export interface CommandResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
}

export interface NodeCheckResult {
  installed: boolean;
  version?: string;
  majorVersion?: number;
  needUpdate: boolean;
}

export interface NpmCheckResult {
  installed: boolean;
  version?: string;
}

export interface GitCheckResult {
  installed: boolean;
  version?: string;
  majorVersion?: number;
  needUpdate: boolean;
}

export interface OpenClawCheckResult {
  installed: boolean;
  version?: string;
}

export interface FeishuCreateChecks {
  createButtonFound: boolean;
  nameInputFound: boolean;
  descInputFound: boolean;
  submitButtonFound: boolean;
  addRobotButtonFound: boolean;
}

export interface FeishuCreateAppParams {
  appName: string;
  appDesc: string;
}

export interface FeishuRpaProgress {
  action: string;
  index: number;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
}

export interface ElectronAPI {
  // 命令执行
  executeCommand: (command: string, options?: { timeout?: number }) => Promise<CommandResult>;
  
  // 环境检查
  checkNode: () => Promise<NodeCheckResult>;
  checkNpm: () => Promise<NpmCheckResult>;
  checkGit: () => Promise<GitCheckResult>;
  checkOpenClaw: () => Promise<OpenClawCheckResult>;
  
  // 配置
  setNpmRegistry: () => Promise<{ success: boolean; registry?: string; error?: string }>;
  configGitProxy: () => Promise<{ success: boolean; error?: string }>;
  
  // 文件操作
  downloadFile: (url: string, destPath: string) => Promise<{ success: boolean; error?: string }>;
  downloadFileWithProgress: (url: string, destPath: string) => Promise<{ success: boolean; error?: string }>;
  
  // 系统操作
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
  showMessageBox: (options: {
    type?: 'none' | 'info' | 'error' | 'question' | 'warning';
    title?: string;
    message: string;
    detail?: string;
    buttons?: string[];
  }) => Promise<{ response: number; checkboxChecked: boolean }>;
  getSystemInfo: () => Promise<SystemInfo>;
  
  // OpenClaw操作
  installOpenClaw: () => Promise<CommandResult>;
  openclawOnboard: () => Promise<{ success: boolean; output?: string; error?: string }>;
  saveOpenClawConfig: (config: object) => Promise<{ success: boolean; path?: string; error?: string }>;
  startOpenClawGateway: () => Promise<{ success: boolean; message?: string; error?: string }>;
  checkPort: (port: number) => Promise<{ open: boolean; port: number; error?: string }>;
  configOpenClawAI: (model: string, apiKey: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  initOpenClawConfig: () => Promise<{ success: boolean; configPath?: string; error?: string }>;
  getVolcengineApiKey: () => Promise<{ success: boolean; apiKey?: string; error?: string; message?: string }>;
  fetchVolcengineApiKey: () => Promise<{ success: boolean; apiKey?: string; noKeys?: boolean; error?: string; message?: string }>;
  getKimiApiKey: () => Promise<{ success: boolean; apiKey?: string; error?: string; message?: string }>;
  getConfigPath: () => Promise<{ path?: string }>;
  setConfigPath: (path: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  readOpenClawConfig: () => Promise<{ success: boolean; config?: unknown; error?: string }>;
  testAIConnection: (params: { model: string; apiKey: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
  listBackups: () => Promise<{ success: boolean; backups?: Array<{ name: string; path: string; time: Date }>; error?: string }>;
  restoreBackup: (backupPath: string) => Promise<{ success: boolean; error?: string }>;
  saveRawConfig: (content: string) => Promise<{ success: boolean; error?: string }>;
  checkFeishuPlugin: () => Promise<{ installed: boolean; output?: string; error?: string }>;
  setFeishuInstallProgressHandler: (handler: ((output: string) => void) | null) => void;
  clearFeishuInstallProgressHandler: () => void;
  setFeishuRpaProgressHandler: (handler: ((progress: FeishuRpaProgress) => void) | null) => void;
  clearFeishuRpaProgressHandler: () => void;
  feishuLogin: () => Promise<{ success: boolean; error?: string }>;
  feishuCreateApp: (params: FeishuCreateAppParams) => Promise<{ success: boolean; checks?: FeishuCreateChecks; error?: string }>;
  feishuConfigPermissions: () => Promise<{ success: boolean; error?: string }>;
  feishuPublishVersion: () => Promise<{ success: boolean; error?: string }>;
  feishuSubscribeEvents: () => Promise<{ success: boolean; error?: string }>;
  feishuGetCredentials: () => Promise<{ success: boolean; data?: { appId: string; appSecret: string }; error?: string }>;
  openFeishuConsole: () => Promise<{ success: boolean; error?: string }>;
  installFeishuPlugin: () => Promise<CommandResult>;
  configFeishuChannel: (appId: string, appSecret: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  checkQqPlugin: () => Promise<{ installed: boolean; output?: string; error?: string }>;
  installQqPlugin: () => Promise<{ success: boolean; output?: string; error?: string }>;
  openQqConsole: () => Promise<{ success: boolean; error?: string }>;
  qqCheckLogin: () => Promise<{ loggedIn: boolean; hasCreateBtn?: boolean; error?: string }>;
  qqCreateRobot: () => Promise<{ success: boolean; error?: string }>;
  qqGetCredentials: () => Promise<{ success: boolean; data?: { appId: string; appSecret: string }; error?: string }>;
  configQqChannel: (appId: string, appSecret: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  restartOpenClaw: () => Promise<{ success: boolean; output?: string; error?: string }>;
  uninstallOpenClaw: () => Promise<CommandResult>;
  getDebugStatus: () => Promise<{ enabled: boolean }>;
  setDebugStatus: (enabled: boolean) => Promise<{ success: boolean; enabled?: boolean; configPath?: string; error?: string }>;
  toggleDebug: () => Promise<{ success: boolean; enabled?: boolean; configPath?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    onFeishuInstallProgress?: (output: string) => void;
    onFeishuRpaProgress?: (progress: FeishuRpaProgress) => void;
  }
}

export {};
