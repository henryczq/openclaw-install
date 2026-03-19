import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Tabs, Typography, message } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { useAppStore } from '../store';
import { AIProviderFormCard } from './ai-config/AIProviderFormCard';
import { KIMI_ENDPOINT, KIMI_MODELS, VOLCENGINE_ENDPOINT, VOLCENGINE_MODELS } from './ai-config/constants';
import type { ConnectionTestPayload, ProviderConfigPayload, ProviderTabKey, Status } from './ai-config/types';

const { Title, Text } = Typography;

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidProvider(value: string) {
  return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function AIConfigPage() {
  const { selectedModel, setSelectedModel, apiKey, setApiKey } = useAppStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<Status>('idle');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isGettingKey, setIsGettingKey] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<Status>('idle');
  const [testErrorMessage, setTestErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<ProviderTabKey>('volcengine');
  const [kimiApiKey, setKimiApiKey] = useState('');
  const [kimiShowApiKey, setKimiShowApiKey] = useState(false);
  const [kimiSelectedModel, setKimiSelectedModel] = useState('kimi-k2.5');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [customModelId, setCustomModelId] = useState('');
  const [customProvider, setCustomProvider] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [customShowApiKey, setCustomShowApiKey] = useState(false);

  const resetStatus = () => {
    setSaveStatus('idle');
    setSaveErrorMessage('');
    setTestStatus('idle');
    setTestErrorMessage('');
  };

  const loadConfigFromFile = useCallback(async () => {
    try {
      // 使用新的 getAIConfig 方法获取配置
      const result = await window.electronAPI.getAIConfig();
      if (!result.success || !result.models || result.models.length === 0) {
        console.log('没有已保存的AI配置');
        return;
      }

      // 找到默认模型
      const defaultModelFullName = result.defaultModel;
      const defaultModel = defaultModelFullName
        ? result.models.find(m => m.fullName === defaultModelFullName)
        : result.models[0];

      if (!defaultModel) {
        return;
      }

      const { providerId, modelId, apiKey: savedApiKey, baseUrl: savedBaseUrl } = defaultModel;

      if (providerId === 'volcengine') {
        setSelectedModel(modelId);
        setApiKey(savedApiKey || '');
        setActiveTab('volcengine');
        return;
      }

      if (providerId === 'kimi') {
        setKimiSelectedModel(modelId);
        setKimiApiKey(savedApiKey);
        setActiveTab('kimi');
        return;
      }

      setCustomBaseUrl(savedBaseUrl);
      setCustomModelId(modelId);
      setCustomProvider(providerId);
      setCustomApiKey(savedApiKey);
      setActiveTab('custom');
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  }, [setApiKey, setSelectedModel]);

  useEffect(() => {
    void loadConfigFromFile();
  }, [loadConfigFromFile]);

  const saveProviderConfig = async (configData: ProviderConfigPayload, successText: string) => {
    setIsSaving(true);
    setSaveStatus('idle');
    setSaveErrorMessage('');

    try {
      // 使用新的 saveAIConfig 方法
      const result = await window.electronAPI.saveAIConfig({
        providerId: configData.provider || 'custom',
        baseUrl: configData.baseUrl,
        apiKey: configData.apiKey,
        modelId: configData.modelId,
        modelName: configData.modelName || configData.modelId
      });
      if (!result.success) {
        throw new Error(result.error || '未知错误');
      }

      setSaveStatus('success');
      message.success(successText);
    } catch (error: unknown) {
      const nextErrorMessage = getErrorMessage(error, '保存失败');
      setSaveStatus('error');
      setSaveErrorMessage(nextErrorMessage);
      message.error(nextErrorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const runConnectionTest = async (
    config: ConnectionTestPayload,
    emptyMessage: string,
    successText: string
  ) => {
    if (!config.apiKey.trim()) {
      message.error(emptyMessage);
      return;
    }

    setIsTesting(true);
    setTestStatus('idle');
    setTestErrorMessage('');

    try {
      const result = await window.electronAPI.testAIConnection(config);
      if (!result.success) {
        const nextErrorMessage = result.error || 'AI连接失败，请检查配置是否正确';
        setTestStatus('error');
        setTestErrorMessage(nextErrorMessage);
        message.error(nextErrorMessage);
        return;
      }

      setTestStatus('success');
      message.success(successText);
    } catch (error: unknown) {
      const nextErrorMessage = getErrorMessage(error, '测试连接失败');
      setTestStatus('error');
      setTestErrorMessage(nextErrorMessage);
      message.error(nextErrorMessage);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    const trimmedApiKey = apiKey.trim();
    if (!trimmedApiKey) {
      setSaveStatus('error');
      setSaveErrorMessage('API Key不能为空');
      return;
    }

    const selectedModelInfo = VOLCENGINE_MODELS.find((model) => model.value === selectedModel);
    await saveProviderConfig({
      provider: 'volcengine',
      baseUrl: VOLCENGINE_ENDPOINT,
      apiKey: trimmedApiKey,
      modelId: selectedModel,
      modelName: selectedModelInfo?.label || selectedModel,
    }, '火山引擎配置保存成功');
  };

  const handleKimiSave = async () => {
    const trimmedApiKey = kimiApiKey.trim();
    if (!trimmedApiKey) {
      setSaveStatus('error');
      setSaveErrorMessage('API Key不能为空');
      message.error('API Key不能为空');
      return;
    }

    const selectedModelInfo = KIMI_MODELS.find((model) => model.value === kimiSelectedModel);
    await saveProviderConfig({
      provider: 'kimi',
      baseUrl: KIMI_ENDPOINT,
      apiKey: trimmedApiKey,
      modelId: kimiSelectedModel,
      modelName: selectedModelInfo?.label || kimiSelectedModel,
    }, 'KIMI 配置保存成功');
  };

  const handleCustomSave = async () => {
    const trimmedBaseUrl = customBaseUrl.trim();
    const trimmedModelId = customModelId.trim();
    const trimmedProvider = customProvider.trim();
    const trimmedApiKey = customApiKey.trim();

    if (!trimmedProvider) {
      setSaveStatus('error');
      setSaveErrorMessage('Provider 不能为空');
      message.error('请输入 Provider');
      return;
    }

    if (!isValidProvider(trimmedProvider)) {
      setSaveStatus('error');
      setSaveErrorMessage('Provider 格式不正确');
      message.error('Provider 只能包含英文字母、数字、下划线和连字符，且必须以英文字母开头');
      return;
    }

    if (!trimmedBaseUrl) {
      setSaveStatus('error');
      setSaveErrorMessage('API URL不能为空');
      message.error('请输入 API URL');
      return;
    }

    if (!isValidUrl(trimmedBaseUrl)) {
      setSaveStatus('error');
      setSaveErrorMessage('请输入有效的 API URL');
      message.error('请输入有效的 API URL');
      return;
    }

    if (!trimmedModelId) {
      setSaveStatus('error');
      setSaveErrorMessage('模型 ID 不能为空');
      message.error('请输入模型 ID');
      return;
    }

    if (!trimmedApiKey) {
      setSaveStatus('error');
      setSaveErrorMessage('API Key不能为空');
      message.error('请输入 API Key');
      return;
    }

    await saveProviderConfig({
      provider: trimmedProvider,
      baseUrl: trimmedBaseUrl,
      apiKey: trimmedApiKey,
      modelId: trimmedModelId,
      modelName: trimmedModelId,
    }, '自定义配置保存成功');
  };

  const handleTestConnection = async () => {
    await runConnectionTest({
      provider: 'volcengine',
      model: selectedModel,
      apiKey: apiKey.trim(),
      baseUrl: VOLCENGINE_ENDPOINT,
    }, '请先输入 API Key', '火山引擎连接测试成功');
  };

  const handleKimiTest = async () => {
    await runConnectionTest({
      provider: 'kimi',
      model: kimiSelectedModel,
      apiKey: kimiApiKey.trim(),
      baseUrl: KIMI_ENDPOINT,
    }, '请先输入 KIMI API Key', 'KIMI 连接测试成功');
  };

  const handleCustomTest = async () => {
    const trimmedBaseUrl = customBaseUrl.trim();
    const trimmedModelId = customModelId.trim();
    const trimmedApiKey = customApiKey.trim();

    if (!trimmedBaseUrl) {
      message.error('请先输入 API URL');
      return;
    }

    if (!isValidUrl(trimmedBaseUrl)) {
      message.error('请输入有效的 API URL');
      return;
    }

    if (!trimmedModelId) {
      message.error('请先输入模型 ID');
      return;
    }

    await runConnectionTest({
      provider: 'custom',
      model: trimmedModelId,
      apiKey: trimmedApiKey,
      baseUrl: trimmedBaseUrl,
    }, '请先输入 API Key', '自定义连接测试成功');
  };

  const openVolcengineConsole = async () => {
    setIsGettingKey(true);
    try {
      if (window.electronAPI?.getVolcengineApiKey) {
        const result = await window.electronAPI.getVolcengineApiKey();
        if (result.success && result.apiKey) {
          setApiKey(result.apiKey);
          message.success('已自动获取并填充 API Key');
          return;
        }
        if (result.success) {
          message.info(result.message || '已打开火山引擎控制台，请登录后重试');
          return;
        }
        message.error(result.error || '自动获取失败，请重试');
        return;
      }

      message.error('功能不可用');
    } catch {
      message.error('获取失败');
    } finally {
      setIsGettingKey(false);
    }
  };

  const fetchVolcengineApiKey = async () => {
    setIsGettingKey(true);
    try {
      if (window.electronAPI?.fetchVolcengineApiKey) {
        const result = await window.electronAPI.fetchVolcengineApiKey();

        if (result.success && result.apiKey) {
          setApiKey(result.apiKey);
          message.success('已自动获取并填充 API Key');
          return;
        }
        if (result.needLogin) {
          message.warning('检测到未登录，请在弹出的窗口中登录火山引擎账号，登录后请再次点击“去火山引擎获取”');
          return;
        }
        if (result.noKeys) {
          message.warning('没有找到已有的 API Key，请使用“去火山引擎创建”创建新的 Key');
          return;
        }
        if (result.message) {
          message.info(result.message);
          return;
        }
        message.error(result.error || '获取失败：未知错误');
        return;
      }

      message.error('功能不可用');
    } catch (error: unknown) {
      message.error(`获取失败: ${getErrorMessage(error, '未知错误')}`);
    } finally {
      setIsGettingKey(false);
    }
  };

  const openKimiConsole = async () => {
    try {
      if (window.electronAPI?.getKimiApiKey) {
        const result = await window.electronAPI.getKimiApiKey();
        if (result.success && result.apiKey) {
          setKimiApiKey(result.apiKey);
          message.success('已自动获取并填充 KIMI API Key');
          return;
        }
        if (result.success) {
          message.info(result.message || '已打开 KIMI 控制台，请登录后重试');
          return;
        }
        message.error(result.error || '自动获取失败，请重试');
        return;
      }

      message.error('功能不可用');
    } catch {
      message.error('获取失败');
    }
  };

  const renderStatusAlerts = () => (
    <>
      {saveStatus === 'success' && <Alert message="配置保存成功" type="success" showIcon />}
      {saveStatus === 'error' && <Alert message={saveErrorMessage || '配置保存失败'} type="error" showIcon />}
      {testStatus === 'success' && <Alert message="连接测试成功" type="success" showIcon />}
      {testStatus === 'error' && <Alert message={testErrorMessage || '连接测试失败'} type="error" showIcon />}
    </>
  );

  const handleTabChange = (key: string) => {
    resetStatus();
    setActiveTab(key as ProviderTabKey);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>AI模型配置</Title>
      <Text type="secondary">配置 OpenClaw 使用的 AI 大模型</Text>

      <Alert
        message="警告：此功能会覆盖原有 AI 模型相关配置"
        description="保存配置将修改 agents.defaults.model.primary 和 models.providers 配置项，请确保已备份重要配置。"
        type="warning"
        showIcon
        style={{ marginTop: 16 }}
      />

      <Tabs activeKey={activeTab} onChange={handleTabChange} style={{ marginTop: 16 }}>
        <Tabs.TabPane tab="火山引擎" key="volcengine">
          <AIProviderFormCard
            description="目前支持火山引擎 Ark Coding 接口配置。"
            endpoint={VOLCENGINE_ENDPOINT}
            modelValue={selectedModel}
            modelOptions={VOLCENGINE_MODELS}
            onModelChange={setSelectedModel}
            apiKeyValue={apiKey}
            apiKeyPlaceholder="请输入从火山引擎获取的 API Key"
            apiKeyVisible={showApiKey}
            onApiKeyChange={setApiKey}
            onApiKeyVisibleChange={setShowApiKey}
            apiKeyActions={(
              <>
                <Button
                  type="link"
                  icon={<LinkOutlined />}
                  onClick={openVolcengineConsole}
                  size="small"
                  loading={isGettingKey}
                >
                  {isGettingKey ? '正在获取...' : '去火山引擎创建'}
                </Button>
                <Button
                  type="link"
                  icon={<LinkOutlined />}
                  onClick={fetchVolcengineApiKey}
                  size="small"
                  loading={isGettingKey}
                >
                  去火山引擎获取
                </Button>
              </>
            )}
            statusAlerts={renderStatusAlerts()}
            onSave={handleSave}
            onTest={handleTestConnection}
            isSaving={isSaving}
            isTesting={isTesting}
            saveDisabled={!apiKey.trim()}
            testDisabled={!apiKey.trim()}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="KIMI" key="kimi">
          <AIProviderFormCard
            endpoint={KIMI_ENDPOINT}
            modelValue={kimiSelectedModel}
            modelOptions={KIMI_MODELS}
            onModelChange={setKimiSelectedModel}
            apiKeyValue={kimiApiKey}
            apiKeyPlaceholder="请输入从 KIMI 获取的 API Key"
            apiKeyVisible={kimiShowApiKey}
            onApiKeyChange={setKimiApiKey}
            onApiKeyVisibleChange={setKimiShowApiKey}
            apiKeyActions={(
              <Button type="link" icon={<LinkOutlined />} onClick={openKimiConsole} size="small">
                去 KIMI 创建
              </Button>
            )}
            statusAlerts={renderStatusAlerts()}
            onSave={handleKimiSave}
            onTest={handleKimiTest}
            isSaving={isSaving}
            isTesting={isTesting}
            saveDisabled={!kimiApiKey.trim()}
            testDisabled={!kimiApiKey.trim()}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="自定义" key="custom">
          <AIProviderFormCard
            description="适用于兼容 OpenAI Chat Completions 的服务，请填写基础 URL（例如 https://api.example.com/v1）、模型 ID 和 API Key。"
            endpointLabel="API URL"
            endpoint={customBaseUrl}
            endpointEditable
            endpointPlaceholder="请输入兼容 OpenAI 的 API URL，例如 https://api.example.com/v1"
            onEndpointChange={setCustomBaseUrl}
            providerLabel="Provider"
            providerValue={customProvider}
            providerEditable
            providerPlaceholder="请输入英文 Provider 名称，例如 deepseek"
            onProviderChange={setCustomProvider}
            modelLabel="模型 ID"
            modelValue={customModelId}
            modelEditable
            modelPlaceholder="请输入模型 ID，例如 gpt-4.1-mini"
            onModelChange={setCustomModelId}
            apiKeyValue={customApiKey}
            apiKeyPlaceholder="请输入自定义服务的 API Key"
            apiKeyVisible={customShowApiKey}
            onApiKeyChange={setCustomApiKey}
            onApiKeyVisibleChange={setCustomShowApiKey}
            statusAlerts={renderStatusAlerts()}
            onSave={handleCustomSave}
            onTest={handleCustomTest}
            isSaving={isSaving}
            isTesting={isTesting}
            saveDisabled={!customProvider.trim() || !customBaseUrl.trim() || !customModelId.trim() || !customApiKey.trim()}
            testDisabled={!customProvider.trim() || !customBaseUrl.trim() || !customModelId.trim() || !customApiKey.trim()}
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}
