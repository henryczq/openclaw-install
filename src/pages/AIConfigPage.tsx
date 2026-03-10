import { useState, useEffect } from 'react';
import { Card, Typography, Select, Button, Space, Alert, Input, Tag, message, Tabs } from 'antd';
import { SaveOutlined, LinkOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useAppStore } from '../store';

const { Title, Text } = Typography;
const { Option } = Select;

const VOLCENGINE_MODELS = [
  { value: 'doubao-seed-2.0-code', label: '豆包 Seed 2.0 Code', desc: '代码生成专用模型' },
  { value: 'doubao-seed-2.0-pro', label: '豆包 Seed 2.0 Pro', desc: '专业版通用模型' },
  { value: 'doubao-seed-2.0-lite', label: '豆包 Seed 2.0 Lite', desc: '轻量版快速响应' },
  { value: 'doubao-seed-code', label: '豆包 Seed Code', desc: '代码辅助模型' },
  { value: 'minimax-m2.5', label: 'MiniMax M2.5', desc: 'MiniMax大模型' },
  { value: 'glm-4.7', label: 'GLM-4.7', desc: '智谱AI大模型' },
  { value: 'deepseek-v3.2', label: 'DeepSeek V3.2', desc: '深度求索大模型' },
  { value: 'kimi-k2.5', label: 'Kimi K2.5', desc: '月之暗面大模型' },
];

const VOLCENGINE_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/coding/v3';
const KIMI_ENDPOINT = 'https://api.moonshot.cn/v1';

const KIMI_MODELS = [
  { value: 'kimi-k2.5', label: 'Kimi K2.5', desc: 'Kimi 迄今最智能的模型，支持视觉与文本输入，上下文 256k' },
  { value: 'kimi-k2-0905-preview', label: 'Kimi K2 0905', desc: '上下文长度 256k，增强 Agentic Coding 能力' },
  { value: 'kimi-k2-0711-preview', label: 'Kimi K2 0711', desc: '上下文长度 128k，MoE 架构，超强代码和 Agent 能力' },
  { value: 'kimi-k2-turbo-preview', label: 'Kimi K2 Turbo', desc: 'K2 高速版本，输出速度每秒 60-100 tokens，上下文 256k' },
  { value: 'kimi-k2-thinking', label: 'Kimi K2 Thinking', desc: 'K2 长思考模型，支持多步工具调用，上下文 256k' },
  { value: 'kimi-k2-thinking-turbo', label: 'Kimi K2 Thinking Turbo', desc: 'K2 长思考高速版，深度推理，输出速度每秒 60-100 tokens' },
  { value: 'moonshot-v1-8k', label: 'Moonshot V1 8K', desc: '适用于生成短文本，上下文长度 8k' },
  { value: 'moonshot-v1-32k', label: 'Moonshot V1 32K', desc: '适用于生成长文本，上下文长度 32k' },
  { value: 'moonshot-v1-128k', label: 'Moonshot V1 128K', desc: '适用于生成超长文本，上下文长度 128k' },
  { value: 'moonshot-v1-8k-vision-preview', label: 'Moonshot V1 8K Vision', desc: 'Vision 视觉模型，理解图片内容，上下文 8k' },
  { value: 'moonshot-v1-32k-vision-preview', label: 'Moonshot V1 32K Vision', desc: 'Vision 视觉模型，理解图片内容，上下文 32k' },
];

export default function AIConfigPage() {
  const { selectedModel, setSelectedModel, apiKey, setApiKey } = useAppStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isGettingKey, setIsGettingKey] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState('volcengine');
  const [kimiApiKey, setKimiApiKey] = useState('');
  const [kimiShowApiKey, setKimiShowApiKey] = useState(false);
  const [kimiSelectedModel, setKimiSelectedModel] = useState('kimi-k2.5');

  useEffect(() => {
    loadConfigFromFile();
  }, []);

  const loadConfigFromFile = async () => {
    try {
      const result = await window.electronAPI.readOpenClawConfig();
      if (result.success && result.config) {
        const config = result.config as any;
        const savedModel = config?.agents?.defaults?.model?.primary;
        const providers = config?.models?.providers;
        if (savedModel) {
          const [providerName, modelId] = savedModel.split(':');
          if (providerName && modelId) {
            const provider = providers?.[providerName];
            if (provider?.apiKey) {
              if (providerName === 'volcengine') {
                setSelectedModel(modelId);
                setApiKey(provider.apiKey);
                setActiveTab('volcengine');
              } else if (providerName === 'kimi') {
                setKimiApiKey(provider.apiKey);
                setActiveTab('kimi');
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setSaveStatus('error');
      setErrorMessage('API Key不能为空');
      return;
    }
    setIsSaving(true);
    try {
      const result = await window.electronAPI.configOpenClawAI(selectedModel, apiKey);
      if (result.success) {
        setSaveStatus('success');
        message.success('配置保存成功');
      } else {
        throw new Error(result.error || '未知错误');
      }
    } catch (error) {
      setSaveStatus('error');
      message.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKimiSave = async () => {
    if (!kimiApiKey.trim()) {
      message.error('API Key不能为空');
      return;
    }
    setIsSaving(true);
    try {
      const selectedModelInfo = KIMI_MODELS.find(m => m.value === kimiSelectedModel);
      const configData = { baseUrl: KIMI_ENDPOINT, apiKey: kimiApiKey, modelId: kimiSelectedModel, modelName: selectedModelInfo?.label || kimiSelectedModel };
      const result = await window.electronAPI.configOpenClawAI(configData as any, '');
      if (result.success) {
        message.success('KIMI 配置保存成功');
      } else {
        throw new Error(result.error || '未知错误');
      }
    } catch (error) {
      message.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      message.error('请先输入API Key');
      return;
    }
    console.log('开始测试连接...', { model: selectedModel, apiKey: apiKey.substring(0, 10) + '...' });
    setIsTesting(true);
    setTestStatus('idle');
    try {
      const result = await window.electronAPI.testAIConnection({ model: selectedModel, apiKey });
      console.log('测试连接结果:', result);
      if (result.success) {
        setTestStatus('success');
        message.success('连接测试成功');
      } else {
        setTestStatus('error');
        message.error('AI连接失败，请确认KEY是否正确，或者额度不足');
      }
    } catch (error: any) {
      console.error('测试连接异常:', error);
      setTestStatus('error');
      message.error(`测试出错: ${error?.message || '未知错误'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleKimiTest = async () => {
    if (!kimiApiKey.trim()) {
      message.error('请先输入 KIMI API Key');
      return;
    }
    console.log('开始测试 KIMI 连接...', { model: kimiSelectedModel, apiKey: kimiApiKey.substring(0, 10) + '...' });
    setIsTesting(true);
    setTestStatus('idle');
    try {
      const result = await window.electronAPI.testAIConnection({ model: kimiSelectedModel, apiKey: kimiApiKey });
      console.log('KIMI 测试连接结果:', result);
      if (result.success) {
        setTestStatus('success');
        message.success('KIMI 连接测试成功');
      } else {
        setTestStatus('error');
        message.error('AI连接失败，请确认KEY是否正确，或者额度不足');
      }
    } catch (error: any) {
      console.error('KIMI 测试连接异常:', error);
      setTestStatus('error');
      message.error(`测试出错: ${error?.message || '未知错误'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const openVolcengineConsole = async () => {
    setIsGettingKey(true);
    try {
      if (window.electronAPI?.getVolcengineApiKey) {
        const result = await window.electronAPI.getVolcengineApiKey();
        if (result.success && result.apiKey) {
          setApiKey(result.apiKey);
          message.success('已自动获取并填充API Key');
          return;
        }
        if (result && result.success) {
          message.info(result.message || '已打开火山引擎控制台，请登录后重试');
          return;
        }
        if (result && result.success === false) {
          message.error('自动获取失败，请重试');
          return;
        }
      }
      message.error('功能不可用');
    } catch (error) {
      message.error('获取失败');
    } finally {
      setIsGettingKey(false);
    }
  };

  const fetchVolcengineApiKey = async () => {
    setIsGettingKey(true);
    try {
      console.log('fetchVolcengineApiKey 被调用');
      console.log('window.electronAPI:', window.electronAPI);
      console.log('fetchVolcengineApiKey 方法:', window.electronAPI?.fetchVolcengineApiKey);

      if (window.electronAPI?.fetchVolcengineApiKey) {
        console.log('开始调用 fetchVolcengineApiKey');
        const result = await window.electronAPI.fetchVolcengineApiKey();
        console.log('fetchVolcengineApiKey 返回结果:', result);

        if (result.success && result.apiKey) {
          setApiKey(result.apiKey);
          message.success('已自动获取并填充API Key');
          return;
        }
        if (result.noKeys) {
          message.warning('没有找到已有的API Key，请使用"去火山引擎创建"创建新的KEY');
          return;
        }
        if (result.message) {
          message.info(result.message);
          return;
        }
        message.error('获取失败：未知错误');
      } else {
        console.error('fetchVolcengineApiKey 方法不存在');
        message.error('功能不可用');
      }
    } catch (error: any) {
      console.error('fetchVolcengineApiKey 异常:', error);
      message.error('获取失败: ' + (error?.message || '未知错误'));
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
        if (result && result.success) {
          message.info(result.message || '已打开 KIMI 控制台,请登录后重试');
          return;
        }
        if (result && result.success === false) {
          message.error('自动获取失败，请重试');
          return;
        }
      }
      message.error('功能不可用');
    } catch (error) {
      message.error('获取失败');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>AI模型配置</Title>
      <Text type="secondary">配置OpenClaw使用的AI大模型</Text>

      <Alert
        message="警告：此功能会覆盖原有AI模型相关配置"
        description="保存配置将修改 agents.defaults.model.primary 和 llm_providers 配置项，请确保已备份重要配置。"
        type="warning"
        showIcon
        style={{ marginTop: 16 }}
      />

      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginTop: 16 }}>
        <Tabs.TabPane tab="火山引擎" key="volcengine">
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Alert
                message="配置说明"
                description="目前仅支持火山引擎 Coding Plan 配置方式"
                type="info"
                showIcon
              />
              <div>
                <Text strong>API端点：</Text>
                <Tag color="blue"><code>{VOLCENGINE_ENDPOINT}</code></Tag>
              </div>
              <div>
                <Text strong>选择AI模型：</Text>
                <Select style={{ width: '100%', marginTop: 8 }} value={selectedModel} onChange={setSelectedModel} size="large">
                  {VOLCENGINE_MODELS.map(model => (
                    <Option key={model.value} value={model.value}>
                      <Space><span>{model.label}</span><Text type="secondary" style={{ fontSize: 12 }}>{model.desc}</Text></Space>
                    </Option>
                  ))}
                </Select>
              </div>
              <div>
                <Space style={{ marginBottom: 8 }}>
                  <Text strong>API Key：</Text>
                  <Button type="link" icon={<LinkOutlined />} onClick={openVolcengineConsole} size="small" loading={isGettingKey}>
                    {isGettingKey ? '正在获取...' : '去火山引擎创建'}
                  </Button>
                  <Button type="link" icon={<LinkOutlined />} onClick={fetchVolcengineApiKey} size="small" loading={isGettingKey}>
                    去火山引擎获取
                  </Button>
                </Space>
                <Input.Password value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="请输入从火山引擎获取的API Key" size="large" visibilityToggle={{ visible: showApiKey, onVisibleChange: setShowApiKey }} />
              </div>
              {testStatus === 'success' && <Alert message="连接测试成功" type="success" showIcon />}
              {testStatus === 'error' && <Alert message="AI连接失败，请确认KEY是否正确，或者额度不足" type="error" showIcon />}
              <Space>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={isSaving} disabled={!apiKey.trim()}>保存配置</Button>
                <Button icon={isTesting ? <LoadingOutlined /> : <CheckCircleOutlined />} onClick={handleTestConnection} loading={isTesting} disabled={!apiKey.trim()}>{isTesting ? '测试中...' : '测试连接'}</Button>
              </Space>
              {saveStatus === 'success' && <Alert message="配置保存成功" type="success" showIcon />}
              {saveStatus === 'error' && <Alert message={errorMessage || '配置保存失败'} type="error" showIcon />}
            </Space>
          </Card>
        </Tabs.TabPane>
        <Tabs.TabPane tab="KIMI" key="kimi">
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>API端点：</Text>
                <Tag color="blue"><code>{KIMI_ENDPOINT}</code></Tag>
              </div>
              <div>
                <Text strong>选择AI模型：</Text>
                <Select style={{ width: '100%', marginTop: 8 }} value={kimiSelectedModel} onChange={setKimiSelectedModel} size="large">
                  {KIMI_MODELS.map(model => (
                    <Option key={model.value} value={model.value}>
                      <Space><span>{model.label}</span><Text type="secondary" style={{ fontSize: 12 }}>{model.desc}</Text></Space>
                    </Option>
                  ))}
                </Select>
              </div>
              <div>
                <Space style={{ marginBottom: 8 }}>
                  <Text strong>API Key：</Text>
                  <Button type="link" icon={<LinkOutlined />} onClick={openKimiConsole} size="small">去 KIMI 创建</Button>
                </Space>
                <Input.Password value={kimiApiKey} onChange={(e) => setKimiApiKey(e.target.value)} placeholder="请输入从 KIMI 获取的API Key" size="large" visibilityToggle={{ visible: kimiShowApiKey, onVisibleChange: setKimiShowApiKey }} />
              </div>
              {testStatus === 'success' && <Alert message="连接测试成功" type="success" showIcon />}
              {testStatus === 'error' && <Alert message="AI连接失败，请确认KEY是否正确，或者额度不足" type="error" showIcon />}
              <Space>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleKimiSave} loading={isSaving} disabled={!kimiApiKey.trim()}>保存配置</Button>
                <Button icon={isTesting ? <LoadingOutlined /> : <CheckCircleOutlined />} onClick={handleKimiTest} loading={isTesting} disabled={!kimiApiKey.trim()}>{isTesting ? '测试中...' : '测试连接'}</Button>
              </Space>
            </Space>
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}
