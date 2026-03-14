// ============================================
// 基础类型定义
// ============================================

/** 导航键 */
export type NavKey = 'install' | 'ai-config' | 'channel-config' | 'uninstall' | 'diagnose' | 'settings' | 'channel-settings' | 'guide' | 'about';

/** 安装步骤状态 */
export type InstallStepStatus = 'pending' | 'running' | 'success' | 'error';

/** AI 模型 */
export interface AIModel {
  value: string;
  label: string;
}

// ============================================
// 配置相关类型
// ============================================

/** 飞书配置 */
export interface FeishuConfig {
  appName: string;
  appDesc: string;
  appId: string;
  appSecret: string;
}

/** QQ 配置 */
export interface QqConfig {
  appId: string;
  appSecret: string;
}

/** AI 提供商配置 */
export interface AIProviderConfig {
  provider?: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  modelName?: string;
}

/** AI 测试参数 */
export interface AITestParams {
  provider?: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

// ============================================
// 安装步骤相关类型
// ============================================

/** 安装步骤 */
export interface InstallStep {
  id: string;
  title: string;
  description: string;
  status: InstallStepStatus;
  message?: string;
}

// ============================================
// 系统状态相关类型
// ============================================

/** Node.js 检查结果 */
export interface NodeCheckResult {
  installed: boolean;
  version?: string;
  majorVersion?: number;
  needUpdate: boolean;
}

/** npm 检查结果 */
export interface NpmCheckResult {
  installed: boolean;
  version?: string;
  needUpdate?: boolean;
}

/** Git 检查结果 */
export interface GitCheckResult {
  installed: boolean;
  version?: string;
  majorVersion?: number;
  needUpdate: boolean;
}

/** OpenClaw 检查结果 */
export interface OpenClawCheckResult {
  installed: boolean;
  version?: string;
}

/** VC++ 运行库检查结果 */
export interface VCRedistCheckResult {
  installed: boolean;
  vcruntimeExists?: boolean;
  msvcpExists?: boolean;
  message?: string;
  error?: string;
}

/** 系统状态 */
export interface SystemStatus {
  node: NodeCheckResult;
  npm: NpmCheckResult;
  git: GitCheckResult;
  openclaw: OpenClawCheckResult;
  vcredist?: VCRedistCheckResult;
}

/** 系统信息 */
export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  tempPath: string;
}

// ============================================
// 命令执行相关类型
// ============================================

/** 命令执行结果 */
export interface CommandResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
  reasonType?: 'network' | 'permission' | 'git' | 'env' | 'unknown';
  diagnosis?: string[];
  message?: string;
  detached?: boolean;
  needVerify?: boolean;
}

// ============================================
// 下载相关类型
// ============================================

/** 下载进度事件 */
export interface DownloadProgressEvent {
  url: string;
  progress: number;
}

// ============================================
// 飞书 RPA 相关类型
// ============================================

/** 飞书创建应用检查项 */
export interface FeishuCreateChecks {
  createButtonFound: boolean;
  nameInputFound: boolean;
  descInputFound: boolean;
  submitButtonFound: boolean;
  addRobotButtonFound: boolean;
}

/** 飞书创建应用参数 */
export interface FeishuCreateAppParams {
  appName: string;
  appDesc: string;
}

/** 飞书 RPA 进度 */
export interface FeishuRpaProgress {
  action: string;
  index: number;
  status: InstallStepStatus;
  message?: string;
}

// ============================================
// 卸载相关类型
// ============================================

/** OpenClaw 残留项 */
export interface OpenClawResidueItem {
  key: string;
  label: string;
  path: string;
  kind: 'file' | 'directory';
}

// ============================================
// Electron API 类型定义
// ============================================

export interface ElectronAPI {
  // 命令执行
  executeCommand: (command: string, options?: { timeout?: number }) => Promise<CommandResult>;

  // 环境检查
  checkNode: () => Promise<NodeCheckResult>;
  checkNpm: () => Promise<NpmCheckResult>;
  checkGit: () => Promise<GitCheckResult>;
  getGitDownloadUrl: () => Promise<{ success: boolean; version?: string; downloadUrl?: string; filename?: string; error?: string }>;
  checkOpenClaw: (strictMode?: boolean) => Promise<OpenClawCheckResult>;
  checkVCRedist: () => Promise<VCRedistCheckResult>;

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

  // OpenClaw 操作
  installOpenClaw: (options?: { enableGitProxy?: boolean }) => Promise<CommandResult>;
  saveOpenClawConfig: (config: object) => Promise<{ success: boolean; path?: string; error?: string }>;
  checkPort: (port: number) => Promise<{ open: boolean; port: number; error?: string }>;
  configOpenClawAI: (config: AIProviderConfig | string, apiKey?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  initOpenClawConfig: () => Promise<{ success: boolean; configPath?: string; error?: string }>;
  getVolcengineApiKey: () => Promise<{ success: boolean; apiKey?: string; error?: string; message?: string }>;
  fetchVolcengineApiKey: () => Promise<{ success: boolean; apiKey?: string; noKeys?: boolean; error?: string; message?: string }>;
  getKimiApiKey: () => Promise<{ success: boolean; apiKey?: string; error?: string; message?: string }>;
  getConfigPath: () => Promise<{ path?: string }>;
  setConfigPath: (path: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  readOpenClawConfig: () => Promise<{ success: boolean; config?: unknown; error?: string }>;
  testAIConnection: (params: AITestParams) => Promise<{ success: boolean; message?: string; error?: string }>;
  getAIConfig: () => Promise<{ success: boolean; models?: Array<{ providerId: string; modelId: string; fullName: string; name: string; baseUrl: string; apiKey: string }>; defaultModel?: string | null; error?: string }>;
  saveAIConfig: (params: { providerId: string; baseUrl: string; apiKey: string; modelId: string; modelName?: string }) => Promise<{ success: boolean; message?: string; fullName?: string; error?: string }>;
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
  checkQqChannelExists: (appId: string) => Promise<{ exists: boolean; existingAppId?: string; error?: string }>;
  deleteQqChannel: () => Promise<{ success: boolean; message?: string; error?: string }>;
  restartOpenClaw: () => Promise<{ success: boolean; output?: string; error?: string }>;
  startOpenClawGateway: () => Promise<{ success: boolean; message?: string; output?: string; error?: string }>;
  stopOpenClawGateway: () => Promise<{ success: boolean; message?: string; output?: string; error?: string }>;
  restartOpenClawGateway: () => Promise<{ success: boolean; message?: string; output?: string; error?: string }>;
  checkGatewayStatus: (port?: number) => Promise<{ running: boolean; port: number; error?: string }>;
  uninstallOpenClaw: () => Promise<CommandResult>;
  detectOpenClawResidue: () => Promise<{ success: boolean; items: OpenClawResidueItem[]; error?: string }>;
  cleanupOpenClawResidue: () => Promise<{
    success: boolean;
    removed: OpenClawResidueItem[];
    failed: Array<OpenClawResidueItem & { error: string }>;
    remaining: OpenClawResidueItem[];
    error?: string;
  }>;
  removeOpenClawResidueItem: (selector: { key?: string; path?: string }) => Promise<{
    success: boolean;
    removed?: OpenClawResidueItem;
    remaining?: OpenClawResidueItem[];
    error?: string;
  }>;
  restartApp: (options?: { continueInstall?: boolean; step?: string }) => Promise<{ success: boolean }>;
  checkContinueInstall: () => Promise<{ shouldContinue: boolean; step?: string }>;
  clearContinueInstall: () => Promise<{ success: boolean; error?: string }>;
  getDebugStatus: () => Promise<{ enabled: boolean }>;
  setDebugStatus: (enabled: boolean) => Promise<{ success: boolean; enabled?: boolean; configPath?: string; error?: string }>;
  toggleDebug: () => Promise<{ success: boolean; enabled?: boolean; configPath?: string; error?: string }>;

  // 模型管理
  listProviders: () => Promise<{ success: boolean; providers?: Array<{ providerId: string; baseUrl: string; apiKey?: string; modelCount: number; models: string[] }>; error?: string }>;
  listModels: () => Promise<{ success: boolean; models?: Array<{ providerId: string; modelId: string; fullName: string; name: string; baseUrl: string; apiKey?: string; contextWindow: number; maxTokens: number; reasoning: boolean; input: ('text' | 'image')[] }>; error?: string }>;
  getDefaultModel: () => Promise<{ success: boolean; model?: string | null; error?: string }>;
  setDefaultModel: (providerId: string, modelId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  deleteModel: (providerId: string, modelId: string, autoDeleteProvider?: boolean) => Promise<{ success: boolean; message: string; providerDeleted?: boolean; providerEmpty?: boolean; isLastModel?: boolean; isDefaultModel?: boolean; error?: string }>;
  deleteProvider: (providerId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  updateModel: (params: { providerId: string; modelId: string; modelName?: string; baseUrl?: string; apiKey?: string; contextWindow?: number; maxTokens?: number; reasoning?: boolean }) => Promise<{ success: boolean; message?: string; fullName?: string; error?: string }>;
  
  // 渠道管理
  listChannels: () => Promise<{ success: boolean; channels?: Array<{ channelId: string; name: string; enabled: boolean; appId?: string; appSecret?: string; token?: string; dmPolicy?: string; groupPolicy?: string; accounts?: Record<string, any>; raw?: any }>; error?: string }>;
  getChannel: (channelId: string) => Promise<{ success: boolean; channel?: { channelId: string; name: string; enabled: boolean; appId?: string; appSecret?: string; token?: string; dmPolicy?: string; groupPolicy?: string; accounts?: Record<string, any>; raw?: any }; error?: string }>;
  saveChannel: (params: { channelId: string; enabled?: boolean; appId?: string; appSecret?: string; token?: string; dmPolicy?: string; groupPolicy?: string }) => Promise<{ success: boolean; message?: string; channelId?: string; error?: string }>;
  deleteChannel: (channelId: string) => Promise<{ success: boolean; message?: string; bindingsRemoved?: number; error?: string }>;
  getChannelBindings: (channelId: string, accountId?: string) => Promise<{ success: boolean; bindings?: Array<{ bindingId: string; agentId: string; agentName: string; accountId: string; peer?: any; workspace?: string; model?: string }>; error?: string }>;
  createBinding: (agentId: string, channelId: string, accountId?: string, peer?: any) => Promise<{ success: boolean; message?: string; agentId?: string; channelId?: string; accountId?: string; error?: string }>;
  removeBinding: (agentId: string, channelId: string, accountId?: string) => Promise<{ success: boolean; message?: string; agentId?: string; channelId?: string; accountId?: string; error?: string }>;
  getFeishuPolicyOptions: () => Promise<{ success: boolean; options?: { dmPolicy: Array<{ value: string; label: string; description: string }>; groupPolicy: Array<{ value: string; label: string; description: string }>; connectionMode: Array<{ value: string; label: string; description: string }>; replyMode: Array<{ value: string; label: string; description: string }>; chunkMode: Array<{ value: string; label: string; description: string }> }; error?: string }>;
  getPolicyOptionDetail: (policyType: string, value: string) => Promise<{ success: boolean; detail?: { value: string; label: string; description: string } | null; error?: string }>;
}

// ============================================
// 全局 Window 扩展
// ============================================

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    onFeishuInstallProgress?: (output: string) => void;
    onFeishuRpaProgress?: (progress: FeishuRpaProgress) => void;
    onDownloadProgress?: (progress: DownloadProgressEvent) => void;
  }
}

export {};
