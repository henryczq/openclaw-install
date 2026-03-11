import fs from 'fs';
import path from 'path';
import os from 'os';
import { getCurrentConfigPath } from '../config/debug-config.js';

/**
 * 获取当前配置路径
 */
function getConfigPath() {
  return getCurrentConfigPath();
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
 * 创建默认模型配置
 * @param {string} modelId 模型 ID
 * @param {string} modelName 模型显示名称（可选，默认使用 modelId）
 * @param {string} api API 类型（可选，默认 "openai-completions"）
 * @returns {Object} 默认模型配置对象
 */
function createDefaultModelConfig(modelId, modelName, api = 'openai-completions') {
  return {
    id: modelId,
    name: modelName || modelId,
    api,
    reasoning: false,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 32000,
    maxTokens: 4096,
  };
}

/**
 * 列出所有 Provider
 */
export function listProviders() {
  const config = readConfig();
  const providers = config.models?.providers || {};
  const result = [];

  for (const [providerId, provider] of Object.entries(providers)) {
    result.push({
      providerId,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      modelCount: provider.models.length,
      models: provider.models.map(m => m.id),
    });
  }

  return result;
}

/**
 * 列出所有已配置的模型
 */
export function listModels() {
  const config = readConfig();
  const providers = config.models?.providers || {};
  const result = [];

  for (const [providerId, provider] of Object.entries(providers)) {
    for (const model of provider.models) {
      result.push({
        providerId,
        modelId: model.id,
        fullName: `${providerId}/${model.id}`,
        name: model.name,
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
        contextWindow: model.contextWindow,
        maxTokens: model.maxTokens,
        reasoning: model.reasoning,
        input: model.input,
      });
    }
  }

  return result;
}

/**
 * 获取单个模型详情
 */
export function getModel(providerId, modelId) {
  const config = readConfig();
  const provider = config.models?.providers?.[providerId];
  if (!provider) return null;

  const model = provider.models.find(m => m.id === modelId);
  if (!model) return null;

  return {
    providerId,
    modelId: model.id,
    fullName: `${providerId}/${model.id}`,
    name: model.name,
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey,
    contextWindow: model.contextWindow,
    maxTokens: model.maxTokens,
    reasoning: model.reasoning,
    input: model.input,
  };
}

/**
 * 新增模型
 * @param {Object} params 新增模型参数
 * @param {string} params.providerId Provider ID
 * @param {string} params.baseUrl API 基础 URL
 * @param {string} params.apiKey API 密钥
 * @param {string} params.modelId 模型 ID
 * @param {string} [params.modelName] 模型显示名称（可选，默认使用 modelId）
 * @param {number} [params.contextWindow] 上下文窗口大小（可选，默认 32000）
 * @param {number} [params.maxTokens] 最大 Token 数（可选，默认 4096）
 * @param {string} [params.api] API 类型（可选，默认 "openai-completions"）
 * @param {string} [params.providerApi] Provider API 类型（可选，默认 "openai-completions"）
 * @returns {Object} 操作结果
 */
export function addModel(params) {
  const { providerId, baseUrl, apiKey, modelId, modelName, contextWindow, maxTokens, api, providerApi } = params;

  if (!providerId || !baseUrl || !modelId) {
    return { success: false, message: 'providerId, baseUrl, modelId are required' };
  }

  const config = readConfig();

  // 初始化 models 结构，设置 mode 为 "merge"
  if (!config.models) {
    config.models = { mode: 'merge', providers: {} };
  }
  if (!config.models.providers) {
    config.models.providers = {};
  }
  // 确保 mode 字段存在
  if (!config.models.mode) {
    config.models.mode = 'merge';
  }

  const providers = config.models.providers;
  const modelApi = api || 'openai-completions';
  const provApi = providerApi || 'openai-completions';

  if (providers[providerId]) {
    const existingModel = providers[providerId].models.find(m => m.id === modelId);
    if (existingModel) {
      return { success: false, message: `Model ${providerId}/${modelId} already exists` };
    }

    providers[providerId].models.push({
      ...createDefaultModelConfig(modelId, modelName, modelApi),
      contextWindow: contextWindow || 32000,
      maxTokens: maxTokens || 4096,
    });
  } else {
    providers[providerId] = {
      baseUrl,
      apiKey,
      api: provApi,
      models: [{
        ...createDefaultModelConfig(modelId, modelName, modelApi),
        contextWindow: contextWindow || 32000,
        maxTokens: maxTokens || 4096,
      }],
    };
  }

  // 同时添加到 agents.defaults.models
  if (!config.agents) config.agents = {};
  if (!config.agents.defaults) config.agents.defaults = {};
  if (!config.agents.defaults.models) config.agents.defaults.models = {};

  const modelKey = `${providerId}/${modelId}`;
  if (!config.agents.defaults.models[modelKey]) {
    config.agents.defaults.models[modelKey] = {};
  }

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }
  return {
    success: true,
    message: `Model ${providerId}/${modelId} added`,
    fullName: `${providerId}/${modelId}`
  };
}

/**
 * 更新模型
 */
export function updateModel(params) {
  const { providerId, modelId, newModelId, modelName, baseUrl, apiKey, contextWindow, maxTokens, reasoning, input } = params;

  if (!providerId || !modelId) {
    return { success: false, message: 'providerId and modelId are required' };
  }

  const config = readConfig();
  const provider = config.models?.providers?.[providerId];

  if (!provider) {
    return { success: false, message: `Provider ${providerId} not found` };
  }

  const modelIndex = provider.models.findIndex(m => m.id === modelId);
  if (modelIndex === -1) {
    return { success: false, message: `Model ${providerId}/${modelId} not found` };
  }

  const model = provider.models[modelIndex];
  const oldModelKey = `${providerId}/${modelId}`;

  // 检查新 modelId 是否已存在
  if (newModelId && newModelId !== modelId) {
    const existingModel = provider.models.find(m => m.id === newModelId);
    if (existingModel) {
      return { success: false, message: `Model ${providerId}/${newModelId} already exists` };
    }
    model.id = newModelId;
  }

  // 更新模型字段
  if (modelName !== undefined) model.name = modelName;
  if (contextWindow !== undefined) model.contextWindow = contextWindow;
  if (maxTokens !== undefined) model.maxTokens = maxTokens;
  if (reasoning !== undefined) model.reasoning = reasoning;
  if (input !== undefined) model.input = input;

  // 更新 Provider 字段
  if (baseUrl !== undefined) provider.baseUrl = baseUrl;
  if (apiKey !== undefined) provider.apiKey = apiKey;

  // 更新 agents.defaults.models 中的 key
  const newModelKey = `${providerId}/${newModelId || modelId}`;
  if (oldModelKey !== newModelKey && config.agents?.defaults?.models) {
    const modelConfig = config.agents.defaults.models[oldModelKey];
    delete config.agents.defaults.models[oldModelKey];
    config.agents.defaults.models[newModelKey] = modelConfig || {};
  }

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `Model ${newModelKey} updated`,
    fullName: newModelKey
  };
}

/**
 * 删除模型
 */
export function deleteModel(providerId, modelId, autoDeleteProvider = true) {
  if (!providerId || !modelId) {
    return { success: false, message: 'providerId and modelId are required' };
  }

  const config = readConfig();
  const providers = config.models?.providers;

  if (!providers || !providers[providerId]) {
    return { success: false, message: `Provider ${providerId} not found` };
  }

  const index = providers[providerId].models.findIndex(m => m.id === modelId);
  if (index === -1) {
    return { success: false, message: `Model ${providerId}/${modelId} not found` };
  }

  // 计算所有模型总数
  let totalModels = 0;
  for (const provider of Object.values(providers)) {
    totalModels += provider.models.length;
  }

  if (totalModels <= 1) {
    return {
      success: false,
      message: '这是最后一个模型，不能删除。请先添加一个新模型后再删除此模型。',
      isLastModel: true
    };
  }

  const defaultModel = getDefaultModel();
  const isDefaultModel = defaultModel === `${providerId}/${modelId}`;

  if (isDefaultModel) {
    return {
      success: false,
      message: `模型 ${providerId}/${modelId} 是当前默认模型，不能删除。请先设置其他模型为默认后再删除。`,
      isDefaultModel: true
    };
  }

  providers[providerId].models.splice(index, 1);

  // 从 agents.defaults.models 中移除
  const modelKey = `${providerId}/${modelId}`;
  if (config.agents?.defaults?.models?.[modelKey]) {
    delete config.agents.defaults.models[modelKey];
  }

  // 如果 Provider 下没有模型了
  if (providers[providerId].models.length === 0) {
    if (autoDeleteProvider) {
      delete providers[providerId];
    }
  }

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }

  return {
    success: true,
    message: `模型 ${providerId}/${modelId} 已删除`,
    providerDeleted: providers[providerId] === undefined,
    providerEmpty: providers[providerId]?.models.length === 0,
  };
}

/**
 * 删除整个 Provider
 */
export function deleteProvider(providerId) {
  if (!providerId) {
    return { success: false, message: 'providerId is required' };
  }

  const config = readConfig();
  const providers = config.models?.providers;

  if (!providers || !providers[providerId]) {
    return { success: false, message: `Provider ${providerId} not found` };
  }

  const modelCount = providers[providerId].models.length;

  // 删除 provider 下的所有模型在 agents.defaults.models 中的配置
  if (config.agents?.defaults?.models) {
    const prefix = `${providerId}/`;
    for (const key of Object.keys(config.agents.defaults.models)) {
      if (key.startsWith(prefix)) {
        delete config.agents.defaults.models[key];
      }
    }
  }

  delete providers[providerId];

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }
  return {
    success: true,
    message: `Provider ${providerId} deleted (${modelCount} models removed)`,
  };
}

/**
 * 设置默认模型
 */
export function setDefaultModel(providerId, modelId) {
  if (!providerId || !modelId) {
    return { success: false, message: 'providerId and modelId are required' };
  }

  const config = readConfig();
  const providers = config.models?.providers;

  if (!providers || !providers[providerId]) {
    return { success: false, message: `Provider ${providerId} not found` };
  }

  const model = providers[providerId].models.find(m => m.id === modelId);
  if (!model) {
    return { success: false, message: `Model ${providerId}/${modelId} not found` };
  }

  if (!config.agents) config.agents = {};
  if (!config.agents.defaults) config.agents.defaults = {};
  if (!config.agents.defaults.model || typeof config.agents.defaults.model !== 'object') {
    config.agents.defaults.model = {};
  }

  config.agents.defaults.model.primary = `${providerId}/${modelId}`;

  // 同时添加到 agents.defaults.models
  if (!config.agents.defaults.models) config.agents.defaults.models = {};
  const modelKey = `${providerId}/${modelId}`;
  if (!config.agents.defaults.models[modelKey]) {
    config.agents.defaults.models[modelKey] = {};
  }

  const writeResult = writeConfig(config);
  if (!writeResult.success) {
    return { success: false, message: writeResult.message };
  }
  return { success: true, message: `Default model set to ${providerId}/${modelId}` };
}

/**
 * 获取当前默认模型
 */
export function getDefaultModel() {
  const config = readConfig();
  return config.agents?.defaults?.model?.primary || null;
}

/**
 * 检查模型是否为默认模型
 */
export function isDefaultModel(providerId, modelId) {
  const defaultModel = getDefaultModel();
  return defaultModel === `${providerId}/${modelId}`;
}

/**
 * 获取配置路径
 */
export function getConfigPathExport() {
  return getConfigPath();
}
