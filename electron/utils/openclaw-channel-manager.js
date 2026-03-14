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
 * 列出所有已配置的渠道
 * @returns {Array} 渠道信息数组
 */
export function listChannels() {
  const config = readConfig();
  const channels = config.channels || {};
  const result = [];

  for (const [channelId, channel] of Object.entries(channels)) {
    result.push({
      channelId,
      enabled: channel.enabled,
      ...channel,
    });
  }

  return result;
}

/**
 * 获取单个渠道详情
 * @param {string} channelId 渠道 ID
 * @returns {Object|null} 渠道信息
 */
export function getChannel(channelId) {
  const config = readConfig();
  const channel = config.channels?.[channelId];
  if (!channel) return null;

  return {
    channelId,
    ...channel,
  };
}

/**
 * 保存渠道配置（新增或更新）
 * @param {Object} params 渠道配置参数
 * @param {string} params.channelId 渠道 ID
 * @param {boolean} params.enabled 是否启用
 * @param {...any} params.rest 其他渠道特定配置
 * @returns {Object} 操作结果
 */
export function saveChannel(params) {
  const { channelId, enabled = true, ...rest } = params;

  if (!channelId) {
    return { success: false, message: 'channelId is required' };
  }

  const config = readConfig();

  if (!config.channels) {
    config.channels = {};
  }

  config.channels[channelId] = {
    enabled,
    ...rest,
  };

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `Channel ${channelId} saved`,
    channelId,
  };
}

/**
 * 更新渠道配置（部分更新）
 * @param {string} channelId 渠道 ID
 * @param {Object} updates 更新的配置
 * @returns {Object} 操作结果
 */
export function updateChannel(channelId, updates) {
  if (!channelId) {
    return { success: false, message: 'channelId is required' };
  }

  const config = readConfig();

  if (!config.channels?.[channelId]) {
    return { success: false, message: `Channel ${channelId} not found` };
  }

  config.channels[channelId] = {
    ...config.channels[channelId],
    ...updates,
  };

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `Channel ${channelId} updated`,
    channelId,
  };
}

/**
 * 删除渠道
 * @param {string} channelId 渠道 ID
 * @returns {Object} 操作结果
 */
export function deleteChannel(channelId) {
  if (!channelId) {
    return { success: false, message: 'channelId is required' };
  }

  const config = readConfig();

  if (!config.channels?.[channelId]) {
    return { success: false, message: `Channel ${channelId} not found` };
  }

  delete config.channels[channelId];

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `Channel ${channelId} deleted`,
    channelId,
  };
}

/**
 * 启用渠道
 * @param {string} channelId 渠道 ID
 * @returns {Object} 操作结果
 */
export function enableChannel(channelId) {
  return updateChannel(channelId, { enabled: true });
}

/**
 * 禁用渠道
 * @param {string} channelId 渠道 ID
 * @returns {Object} 操作结果
 */
export function disableChannel(channelId) {
  return updateChannel(channelId, { enabled: false });
}

// ==================== 飞书专用配置方法 ====================

/**
 * 配置飞书渠道
 * @param {Object} params 飞书配置参数
 * @param {boolean} params.enabled 是否启用
 * @param {string} params.appId 飞书应用 ID
 * @param {string} params.appSecret 飞书应用密钥
 * @param {string} [params.encryptKey] 加密密钥（用于 webhook 消息加密）
 * @param {string} [params.verificationToken] 验证 Token（用于 webhook 验证）
 * @param {string} [params.domain='feishu'] 域名：feishu/lark 或自定义 HTTPS URL
 * @param {string} [params.connectionMode='websocket'] 连接模式：websocket/webhook
 * @param {string} [params.webhookPath] Webhook 路径（webhook 模式使用）
 * @param {number} [params.webhookPort] Webhook 端口（webhook 模式使用）
 * @param {boolean} [params.threadSession=true] 是否启用多任务并行（独立上下文）
 * @param {boolean} [params.requireMention=true] 群内是否需要@机器人才回复
 * @param {string} [params.dmPolicy='pairing'] 私信策略：open/pairing/allowlist/disabled
 * @param {string} [params.groupPolicy='open'] 群组策略：open/allowlist/disabled
 * @param {Array} [params.allowFrom=[]] 用户白名单
 * @param {Array} [params.groupAllowFrom=[]] 群组白名单
 * @param {boolean} [params.streaming=true] 是否启用流式响应
 * @param {string} [params.replyMode='auto'] 回复模式：auto/static/streaming 或对象配置
 * @param {boolean} [params.blockStreaming=false] 是否启用块级流式
 * @param {string} [params.chunkMode='paragraph'] 文本分块模式：newline/paragraph/none
 * @param {number} [params.textChunkLimit] 文本分块大小限制
 * @param {number} [params.historyLimit=50] 历史消息限制
 * @param {number} [params.dmHistoryLimit] 私信历史消息限制
 * @param {number} [params.mediaMaxMb=20] 媒体文件大小限制（MB）
 * @param {boolean} [params.configWrites=true] 是否允许配置写入
 * @param {Object} [params.tools] 飞书工具开关：{doc, wiki, drive, perm, scopes}
 * @param {Object} [params.footer] 消息页脚配置：{status, elapsed}
 * @param {Object} [params.accounts={}] 多账号配置
 * @param {Object} [params.groups={}] 群组特定配置
 * @param {Object} [params.heartbeat] 心跳配置
 * @param {Object} [params.uat] UAT 测试配置
 * @returns {Object} 操作结果
 */
export function configureFeishu(params) {
  const {
    enabled = true,
    appId,
    appSecret,
    encryptKey,
    verificationToken,
    domain = 'feishu',
    connectionMode = 'websocket',
    webhookPath,
    webhookPort,
    threadSession = true,
    requireMention = true,
    dmPolicy = 'pairing',
    groupPolicy = 'open',
    allowFrom = [],
    groupAllowFrom = [],
    streaming = true,
    replyMode = 'auto',
    blockStreaming = false,
    chunkMode = 'paragraph',
    textChunkLimit,
    historyLimit = 50,
    dmHistoryLimit,
    mediaMaxMb = 20,
    configWrites = true,
    tools,
    footer,
    accounts = {},
    groups = {},
    heartbeat,
    uat,
  } = params;

  if (!appId || !appSecret) {
    return { success: false, message: '飞书配置需要 appId 和 appSecret' };
  }

  // 构建飞书专用配置
  const feishuConfig = {
    channelId: 'feishu',
    enabled,
    appId,
    appSecret,
    domain,
    connectionMode,
    threadSession,
    requireMention,
    dmPolicy,
    groupPolicy,
    allowFrom,
    groupAllowFrom,
    streaming,
    replyMode,
    blockStreaming,
    chunkMode,
    historyLimit,
    mediaMaxMb,
    configWrites,
    accounts,
    groups,
  };

  // 添加可选字段
  if (encryptKey) feishuConfig.encryptKey = encryptKey;
  if (verificationToken) feishuConfig.verificationToken = verificationToken;
  if (webhookPath) feishuConfig.webhookPath = webhookPath;
  if (webhookPort) feishuConfig.webhookPort = webhookPort;
  if (textChunkLimit) feishuConfig.textChunkLimit = textChunkLimit;
  if (dmHistoryLimit) feishuConfig.dmHistoryLimit = dmHistoryLimit;
  if (tools) feishuConfig.tools = tools;
  if (footer) feishuConfig.footer = footer;
  if (heartbeat) feishuConfig.heartbeat = heartbeat;
  if (uat) feishuConfig.uat = uat;

  return saveChannel(feishuConfig);
}

/**
 * 设置飞书群内回复模式
 * @param {number} mode 回复模式：1=仅@回复, 2=全部回复, 3=指定群@回复
 * @param {Object} [options] 模式3的特定群配置
 * @param {string} [options.groupId] 特定群ID（模式3使用）
 * @param {boolean} [options.groupRequireMention] 该群是否需要@（默认true）
 * @returns {Object} 操作结果
 */
export function setFeishuReplyMode(mode, options = {}) {
  const config = readConfig();
  const channel = config.channels?.feishu;

  if (!channel) {
    return { success: false, message: '飞书渠道未配置，请先调用 configureFeishu' };
  }

  switch (mode) {
    case 1:
      // 模式1：只有 @机器人 才回复
      channel.requireMention = true;
      break;
    case 2:
      // 模式2：不用 @，所有消息都回复
      channel.requireMention = false;
      break;
    case 3:
      // 模式3：只有指定群 @机器人 才回复
      channel.requireMention = true; // 全局默认需要@
      if (options.groupId) {
        if (!channel.groups) channel.groups = {};
        channel.groups[options.groupId] = {
          requireMention: options.groupRequireMention ?? true,
        };
      }
      break;
    default:
      return { success: false, message: '无效的模式，请使用 1/2/3' };
  }

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  const modeDesc = {
    1: '只有 @机器人 才回复',
    2: '不用 @，所有消息都回复',
    3: `指定群 ${options.groupId || ''} 配置完成`,
  };

  return {
    success: true,
    message: `飞书回复模式已设置：${modeDesc[mode]}`,
    mode,
  };
}

/**
 * 设置飞书多任务并行（独立上下文）
 * @param {boolean} enabled 是否启用
 * @returns {Object} 操作结果
 */
export function setFeishuThreadSession(enabled = true) {
  const config = readConfig();
  const channel = config.channels?.feishu;

  if (!channel) {
    return { success: false, message: '飞书渠道未配置，请先调用 configureFeishu' };
  }

  channel.threadSession = enabled;

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `飞书多任务并行已${enabled ? '启用' : '禁用'}`,
    threadSession: enabled,
  };
}

/**
 * 添加飞书账号（多账号支持）
 * @param {string} accountId 账号ID
 * @param {Object} accountConfig 账号配置
 * @param {string} accountConfig.appId 飞书应用 ID
 * @param {string} accountConfig.appSecret 飞书应用密钥
 * @param {string} [accountConfig.name] 账号名称
 * @param {boolean} [accountConfig.enabled=true] 是否启用
 * @returns {Object} 操作结果
 */
export function addFeishuAccount(accountId, accountConfig) {
  const config = readConfig();
  const channel = config.channels?.feishu;

  if (!channel) {
    return { success: false, message: '飞书渠道未配置，请先调用 configureFeishu' };
  }

  if (!channel.accounts) {
    channel.accounts = {};
  }

  channel.accounts[accountId] = {
    enabled: true,
    ...accountConfig,
  };

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `飞书账号 ${accountId} 已添加`,
    accountId,
  };
}

/**
 * 删除飞书账号
 * @param {string} accountId 账号ID
 * @returns {Object} 操作结果
 */
export function removeFeishuAccount(accountId) {
  const config = readConfig();
  const channel = config.channels?.feishu;

  if (!channel?.accounts?.[accountId]) {
    return { success: false, message: `飞书账号 ${accountId} 不存在` };
  }

  delete channel.accounts[accountId];

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `飞书账号 ${accountId} 已删除`,
    accountId,
  };
}

/**
 * 设置飞书群组特定配置
 * @param {string} groupId 群组ID
 * @param {Object} groupConfig 群组配置
 * @param {boolean} [groupConfig.requireMention] 该群是否需要@
 * @param {string} [groupConfig.groupPolicy] 群组策略
 * @param {Array} [groupConfig.allowFrom] 允许的用户列表
 * @returns {Object} 操作结果
 */
export function setFeishuGroupConfig(groupId, groupConfig) {
  const config = readConfig();
  const channel = config.channels?.feishu;

  if (!channel) {
    return { success: false, message: '飞书渠道未配置，请先调用 configureFeishu' };
  }

  if (!channel.groups) {
    channel.groups = {};
  }

  channel.groups[groupId] = {
    ...channel.groups[groupId],
    ...groupConfig,
  };

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `飞书群组 ${groupId} 配置已更新`,
    groupId,
  };
}

// ==================== QQBot 专用配置方法 ====================

/**
 * 配置 QQBot 渠道
 * @param {Object} params QQBot 配置参数
 * @param {boolean} params.enabled 是否启用
 * @param {string} params.appId QQBot 应用 ID
 * @param {string} params.clientSecret QQBot 客户端密钥
 * @param {Array} [params.allowFrom=['*']] 允许的用户列表，默认允许所有
 * @param {Object} [params.accounts={}] 多账号配置
 * @returns {Object} 操作结果
 */
export function configureQQBot(params) {
  const {
    enabled = true,
    appId,
    clientSecret,
    allowFrom = ['*'],
    accounts = {},
  } = params;

  if (!appId || !clientSecret) {
    return { success: false, message: 'QQBot 配置需要 appId 和 clientSecret' };
  }

  return saveChannel({
    channelId: 'qqbot',
    enabled,
    appId,
    clientSecret,
    allowFrom,
    accounts,
  });
}

/**
 * 添加 QQBot 账号
 * @param {string} accountId 账号ID
 * @param {Object} accountConfig 账号配置
 * @param {string} accountConfig.appId QQBot 应用 ID
 * @param {string} accountConfig.clientSecret QQBot 客户端密钥
 * @param {boolean} [accountConfig.enabled=true] 是否启用
 * @returns {Object} 操作结果
 */
export function addQQBotAccount(accountId, accountConfig) {
  const config = readConfig();
  const channel = config.channels?.qqbot;

  if (!channel) {
    return { success: false, message: 'QQBot 渠道未配置，请先调用 configureQQBot' };
  }

  if (!channel.accounts) {
    channel.accounts = {};
  }

  channel.accounts[accountId] = {
    enabled: true,
    ...accountConfig,
  };

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `QQBot 账号 ${accountId} 已添加`,
    accountId,
  };
}

/**
 * 删除 QQBot 账号
 * @param {string} accountId 账号ID
 * @returns {Object} 操作结果
 */
export function removeQQBotAccount(accountId) {
  const config = readConfig();
  const channel = config.channels?.qqbot;

  if (!channel?.accounts?.[accountId]) {
    return { success: false, message: `QQBot 账号 ${accountId} 不存在` };
  }

  delete channel.accounts[accountId];

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `QQBot 账号 ${accountId} 已删除`,
    accountId,
  };
}

// ==================== 策略选项常量 ====================

/**
 * 飞书私信策略选项
 * 控制机器人在私信（单聊）中的行为
 */
export const FeishuDmPolicyOptions = {
  // 允许所有用户私信机器人
  open: {
    value: 'open',
    label: '开放',
    description: '允许所有用户私信机器人',
    requireWildcard: true, // 需要 allowFrom 包含 "*"
  },
  // 仅允许已配对的用户私信（默认）
  pairing: {
    value: 'pairing',
    label: '配对',
    description: '仅允许已配对的用户私信机器人（默认）',
    requireWildcard: false,
  },
  // 仅允许白名单中的用户私信
  allowlist: {
    value: 'allowlist',
    label: '白名单',
    description: '仅允许白名单中的用户私信机器人',
    requireWildcard: false,
  },
  // 禁用私信功能
  disabled: {
    value: 'disabled',
    label: '禁用',
    description: '完全禁用私信功能',
    requireWildcard: false,
  },
};

/**
 * 飞书群组策略选项
 * 控制机器人在群组中的行为
 */
export const FeishuGroupPolicyOptions = {
  // 允许所有群组
  open: {
    value: 'open',
    label: '开放',
    description: '允许机器人在所有群组中响应',
  },
  // 仅允许白名单中的群组
  allowlist: {
    value: 'allowlist',
    label: '白名单',
    description: '仅允许机器人在白名单中的群组响应',
  },
  // 禁用群组功能
  disabled: {
    value: 'disabled',
    label: '禁用',
    description: '完全禁用群组功能',
  },
};

/**
 * 飞书连接模式选项
 */
export const FeishuConnectionModeOptions = {
  // WebSocket 模式（默认）
  websocket: {
    value: 'websocket',
    label: 'WebSocket',
    description: '通过 WebSocket 连接飞书服务器（实时，推荐）',
  },
  // Webhook 模式
  webhook: {
    value: 'webhook',
    label: 'Webhook',
    description: '通过 HTTP Webhook 接收消息（需要公网地址）',
  },
};

/**
 * 飞书回复模式选项
 */
export const FeishuReplyModeOptions = {
  // 自动选择
  auto: {
    value: 'auto',
    label: '自动',
    description: '自动选择最佳回复模式',
  },
  // 静态回复
  static: {
    value: 'static',
    label: '静态',
    description: '使用静态文本回复',
  },
  // 流式回复
  streaming: {
    value: 'streaming',
    label: '流式',
    description: '使用流式输出回复（打字机效果）',
  },
};

/**
 * 飞书文本分块模式选项
 */
export const FeishuChunkModeOptions = {
  // 按换行符分块
  newline: {
    value: 'newline',
    label: '换行符',
    description: '按换行符分割文本',
  },
  // 按段落分块（默认）
  paragraph: {
    value: 'paragraph',
    label: '段落',
    description: '按段落分割文本（推荐）',
  },
  // 不分块
  none: {
    value: 'none',
    label: '不分块',
    description: '不分割文本，一次性发送',
  },
};

/**
 * 获取所有飞书策略选项
 * 供 UI 选择器使用
 * @returns {Object} 所有策略选项
 */
export function getFeishuPolicyOptions() {
  return {
    dmPolicy: Object.values(FeishuDmPolicyOptions),
    groupPolicy: Object.values(FeishuGroupPolicyOptions),
    connectionMode: Object.values(FeishuConnectionModeOptions),
    replyMode: Object.values(FeishuReplyModeOptions),
    chunkMode: Object.values(FeishuChunkModeOptions),
  };
}

/**
 * 获取策略选项的详细说明
 * @param {string} policyType 策略类型：dmPolicy/groupPolicy/connectionMode/replyMode/chunkMode
 * @param {string} value 选项值
 * @returns {Object|null} 选项详情
 */
export function getPolicyOptionDetail(policyType, value) {
  const optionsMap = {
    dmPolicy: FeishuDmPolicyOptions,
    groupPolicy: FeishuGroupPolicyOptions,
    connectionMode: FeishuConnectionModeOptions,
    replyMode: FeishuReplyModeOptions,
    chunkMode: FeishuChunkModeOptions,
  };

  const options = optionsMap[policyType];
  if (!options) return null;

  return options[value] || null;
}

// ==================== 通用工具方法 ====================

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

// ==================== 渠道与 Agent 绑定管理 ====================

/**
 * 生成绑定ID
 */
function generateBindingId(agentId, channelId, accountId) {
  return `${agentId}:${channelId}:${accountId || 'default'}`;
}

/**
 * 创建渠道与 Agent 的绑定
 * @param {string} agentId Agent ID
 * @param {string} channelId 渠道 ID
 * @param {string} accountId 账号 ID（可选）
 * @param {Object} peer 对等配置（可选）
 * @returns {Object} 操作结果
 */
export function createBinding(agentId, channelId, accountId, peer) {
  if (!agentId || !channelId) {
    return { success: false, message: 'agentId and channelId are required' };
  }

  const config = readConfig();

  if (!config.bindings) {
    config.bindings = {};
  }

  const bindingId = generateBindingId(agentId, channelId, accountId);

  config.bindings[bindingId] = {
    agentId,
    channelId,
    accountId: accountId || null,
    peer: peer || null,
    createdAt: new Date().toISOString(),
  };

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `Binding ${bindingId} created`,
    bindingId,
    agentId,
    channelId,
    accountId,
  };
}

/**
 * 删除渠道与 Agent 的绑定
 * @param {string} agentId Agent ID
 * @param {string} channelId 渠道 ID
 * @param {string} accountId 账号 ID（可选）
 * @returns {Object} 操作结果
 */
export function removeBinding(agentId, channelId, accountId) {
  if (!agentId || !channelId) {
    return { success: false, message: 'agentId and channelId are required' };
  }

  const config = readConfig();

  if (!config.bindings) {
    return { success: false, message: 'No bindings found' };
  }

  const bindingId = generateBindingId(agentId, channelId, accountId);

  if (!config.bindings[bindingId]) {
    return { success: false, message: `Binding ${bindingId} not found` };
  }

  delete config.bindings[bindingId];

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `Binding ${bindingId} removed`,
    bindingId,
    agentId,
    channelId,
    accountId,
  };
}

/**
 * 获取渠道绑定的 Agent 列表
 * @param {string} channelId 渠道 ID
 * @param {string} accountId 账号 ID（可选，用于筛选）
 * @returns {Array} 绑定列表
 */
export function getChannelBindings(channelId, accountId) {
  if (!channelId) {
    return [];
  }

  const config = readConfig();

  if (!config.bindings) {
    return [];
  }

  const bindings = Object.entries(config.bindings)
    .filter(([_, binding]) => {
      if (binding.channelId !== channelId) return false;
      if (accountId && binding.accountId !== accountId) return false;
      return true;
    })
    .map(([bindingId, binding]) => ({
      bindingId,
      ...binding,
    }));

  return bindings;
}
