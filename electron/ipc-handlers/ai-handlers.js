import fs from 'fs';
import path from 'path';
import { getConfigPath } from './config-handlers.js';
import { registerVolcengineApiKeyHandler } from './ai/volcengine-handler.js';
import { registerKimiApiKeyHandler } from './ai/kimi-handler.js';

const DEFAULT_VOLCENGINE_BASE_URL = 'https://ark.cn-beijing.volces.com/api/coding/v3';
const DEFAULT_CONTEXT_WINDOW = 128000;
const DEFAULT_MAX_TOKENS = 4096;

function ensureConfigDirectory(configPath) {
  const configDir = path.dirname(configPath);
  if (fs.existsSync(configDir)) {
    return;
  }

  fs.mkdirSync(configDir, { recursive: true });
}

function readExistingConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (error) {
    console.warn('Failed to parse existing AI config:', error);
    return {};
  }
}

function createModelDefinition(id, name) {
  return {
    id,
    name,
    reasoning: false,
    input: ['text'],
    contextWindow: DEFAULT_CONTEXT_WINDOW,
    maxTokens: DEFAULT_MAX_TOKENS
  };
}

function createAgentConfig(provider, modelId) {
  return {
    list: [
      {
        id: 'main',
        model: {
          primary: `${provider}:${modelId}`
        }
      }
    ],
    defaults: {
      model: {
        primary: `${provider}:${modelId}`
      }
    }
  };
}

function getProviderFromBaseUrl(baseUrl) {
  if (baseUrl.includes('moonshot')) return 'kimi';
  if (baseUrl.includes('volces')) return 'volcengine';
  return 'deepseek';
}

function createProviderConfig({ provider, baseUrl, apiKey, modelId, modelName }) {
  return {
    models: {
      providers: {
        [provider]: {
          baseUrl,
          apiKey,
          models: [createModelDefinition(modelId, modelName)]
        }
      }
    },
    agents: createAgentConfig(provider, modelId)
  };
}

function createLegacyVolcengineConfig(model, apiKey) {
  return createProviderConfig({
    provider: 'volcengine',
    baseUrl: DEFAULT_VOLCENGINE_BASE_URL,
    apiKey,
    modelId: model,
    modelName: model
  });
}

function getConnectionProviderName(baseUrl) {
  if (baseUrl.includes('deepseek')) return 'DeepSeek';
  if (baseUrl.includes('moonshot')) return 'KIMI';
  return '火山引擎';
}

async function testStreamingConnection({ model, apiKey, baseUrl }) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'hi' }],
      stream: true,
      max_tokens: 10
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
    };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let receivedValidChunk = false;
  const timeout = setTimeout(() => {
    reader.cancel('Timeout');
  }, 10000);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      if (chunk.includes('data:') && chunk.includes('content')) {
        receivedValidChunk = true;
        break;
      }
    }
  } finally {
    clearTimeout(timeout);
    reader.cancel();
  }

  if (receivedValidChunk) {
    return { success: true };
  }

  return { success: false, error: '未能接收到有效响应数据' };
}

export function registerAIHandlers(ipcMain) {
  ipcMain.handle('config-openclaw-ai', async (event, ...args) => {
    try {
      const configPath = getConfigPath();
      ensureConfigDirectory(configPath);

      const config = readExistingConfig(configPath);
      const configData = args[0];

      const nextConfig = (
        typeof configData === 'object'
        && configData !== null
        && configData.baseUrl
      )
        ? createProviderConfig({
          provider: getProviderFromBaseUrl(configData.baseUrl),
          baseUrl: configData.baseUrl,
          apiKey: configData.apiKey,
          modelId: configData.modelId,
          modelName: configData.modelName
        })
        : createLegacyVolcengineConfig(args[0], args[1]);

      config.models = nextConfig.models;
      config.agents = nextConfig.agents;

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

      return {
        success: true,
        message: `AI 配置已保存到 ${configPath}`
      };
    } catch (error) {
      console.error('Error in config-openclaw-ai:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('test-ai-connection', async (event, params) => {
    try {
      console.log('收到测试连接请求:', params);
      const { model, apiKey, baseUrl: customBaseUrl } = params;
      const baseUrl = customBaseUrl || DEFAULT_VOLCENGINE_BASE_URL;
      const providerName = getConnectionProviderName(baseUrl);
      console.log('开始测试连接:', { model, baseUrl, providerName });

      const result = await testStreamingConnection({ model, apiKey, baseUrl });
      console.log('测试连接结果:', result);

      if (result.success) {
        return {
          success: true,
          message: `${providerName} API 连接成功 (${model})`
        };
      }

      return result;
    } catch (error) {
      console.error('Error testing AI connection:', error);
      return { success: false, error: error.message || '连接测试失败' };
    }
  });

  registerVolcengineApiKeyHandler(ipcMain);
  registerKimiApiKeyHandler(ipcMain);
}
