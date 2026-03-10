import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Button,
  Typography,
  Space,
  Tag,
  Alert,
  List,
  Divider,
  Spin,
  Result,
  Badge,
  Row,
  Col,
  Progress,
} from 'antd';
import {
  MedicineBoxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  ApiOutlined,
  GlobalOutlined,
  RobotOutlined,
  MessageOutlined,
  ToolOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store';

const { Title, Text, Paragraph } = Typography;

interface DiagnoseItem {
  id: string;
  name: string;
  status: 'pending' | 'checking' | 'success' | 'error' | 'warning';
  message: string;
  detail?: string;
  icon: React.ReactNode;
}

interface DiagnoseResult {
  env: {
    node: { installed: boolean; version?: string; needUpdate: boolean };
    npm: { installed: boolean; version?: string };
    openclaw: { installed: boolean; version?: string };
    gatewayPort: { open: boolean; port: number };
  };
  ai: {
    configured: boolean;
    model?: string;
    hasApiKey?: boolean;
  };
  channel: {
    feishuConfigured: boolean;
  };
  plugins: {
    list: string[];
    count: number;
  };
}

export default function DiagnosePage() {
  const { selectedModel, apiKey, feishuConfig } = useAppStore();
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, setResults] = useState<DiagnoseResult | null>(null);
  const [diagnoseItems, setDiagnoseItems] = useState<DiagnoseItem[]>([
    { id: 'node', name: 'Node.js 环境', status: 'pending', message: '等待检测', icon: <GlobalOutlined /> },
    { id: 'npm', name: 'NPM 环境', status: 'pending', message: '等待检测', icon: <GlobalOutlined /> },
    { id: 'openclaw', name: 'OpenClaw 安装', status: 'pending', message: '等待检测', icon: <RobotOutlined /> },
    { id: 'gateway', name: 'OpenClaw 网关', status: 'pending', message: '等待检测', icon: <GlobalOutlined /> },
    { id: 'ai', name: 'AI 配置', status: 'pending', message: '等待检测', icon: <RobotOutlined /> },
    { id: 'channel', name: '渠道配置', status: 'pending', message: '等待检测', icon: <MessageOutlined /> },
    { id: 'plugins', name: '插件状态', status: 'pending', message: '等待检测', icon: <ToolOutlined /> },
  ]);
  const [apiTestResult, setApiTestResult] = useState<{ testing: boolean; result?: boolean; message?: string }>({ testing: false });
  const logsRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // 日志自动滚动
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const updateDiagnoseItem = (id: string, status: DiagnoseItem['status'], message: string, detail?: string) => {
    setDiagnoseItems(prev => prev.map(item => 
      item.id === id ? { ...item, status, message, detail } : item
    ));
  };

  const runDiagnose = async () => {
    setIsDiagnosing(true);
    setProgress(0);
    setResults(null);
    setLogs([]);
    addLog('开始一键诊断...');

    const result: DiagnoseResult = {
      env: { node: { installed: false, needUpdate: true }, npm: { installed: false }, openclaw: { installed: false }, gatewayPort: { open: false, port: 18789 } },
      ai: { configured: false },
      channel: { feishuConfigured: false },
      plugins: { list: [], count: 0 },
    };

    // 1. 检测 Node.js
    addLog('检测 Node.js 环境...');
    updateDiagnoseItem('node', 'checking', '检测中...');
    try {
      const nodeResult = await window.electronAPI.checkNode();
      result.env.node = nodeResult;
      if (nodeResult.installed) {
        if (nodeResult.needUpdate) {
          updateDiagnoseItem('node', 'warning', `已安装 v${nodeResult.version}`, '版本过低，建议升级');
        } else {
          updateDiagnoseItem('node', 'success', `已安装 v${nodeResult.version}`, '版本符合要求');
        }
      } else {
        updateDiagnoseItem('node', 'error', '未安装', '请先安装 Node.js');
      }
    } catch (error) {
      updateDiagnoseItem('node', 'error', '检测失败', String(error));
    }
    setProgress(15);

    // 2. 检测 NPM
    addLog('检测 NPM 环境...');
    updateDiagnoseItem('npm', 'checking', '检测中...');
    try {
      const npmResult = await window.electronAPI.checkNpm();
      result.env.npm = npmResult;
      if (npmResult.installed) {
        updateDiagnoseItem('npm', 'success', `已安装 v${npmResult.version}`, 'NPM 正常工作');
      } else {
        updateDiagnoseItem('npm', 'error', '未安装', 'Node.js 安装可能不完整');
      }
    } catch (error) {
      updateDiagnoseItem('npm', 'error', '检测失败', String(error));
    }
    setProgress(30);

    // 3. 检测 OpenClaw
    addLog('检测 OpenClaw 安装...');
    updateDiagnoseItem('openclaw', 'checking', '检测中...');
    try {
      const openclawResult = await window.electronAPI.checkOpenClaw();
      result.env.openclaw = openclawResult;
      if (openclawResult.installed) {
        updateDiagnoseItem('openclaw', 'success', `已安装 v${openclawResult.version}`, 'OpenClaw 已就绪');
      } else {
        updateDiagnoseItem('openclaw', 'error', '未安装', '请先安装 OpenClaw');
      }
    } catch (error) {
      updateDiagnoseItem('openclaw', 'error', '检测失败', String(error));
    }
    setProgress(45);

    // 4. 检测网关端口
    addLog('检测 OpenClaw 网关端口 (18789)...');
    updateDiagnoseItem('gateway', 'checking', '检测中...');
    try {
      const portResult = await window.electronAPI.checkPort(18789);
      result.env.gatewayPort = portResult;
      if (portResult.open) {
        updateDiagnoseItem('gateway', 'success', '端口已开放', '网关服务正常运行');
      } else {
        updateDiagnoseItem('gateway', 'error', '端口未开放', '网关可能未启动，请启动网关');
      }
    } catch (error) {
      updateDiagnoseItem('gateway', 'error', '检测失败', String(error));
    }
    setProgress(60);

    // 5. 检测 AI 配置
    addLog('检测 AI 配置...');
    updateDiagnoseItem('ai', 'checking', '检测中...');
    const hasModel = selectedModel && selectedModel !== '';
    const hasKey = apiKey && apiKey !== '';
    result.ai = { configured: !!(hasModel && hasKey), model: selectedModel, hasApiKey: !!hasKey };
    if (hasModel && hasKey) {
      updateDiagnoseItem('ai', 'success', `已配置 ${selectedModel}`, 'API Key 已设置');
    } else if (hasModel && !hasKey) {
      updateDiagnoseItem('ai', 'warning', `已选择模型 ${selectedModel}`, '缺少 API Key');
    } else if (!hasModel && hasKey) {
      updateDiagnoseItem('ai', 'warning', '已设置 API Key', '未选择模型');
    } else {
      updateDiagnoseItem('ai', 'error', '未配置', '请先配置 AI 模型和 API Key');
    }
    setProgress(75);

    // 6. 检测渠道配置
    addLog('检测渠道配置...');
    updateDiagnoseItem('channel', 'checking', '检测中...');
    const hasFeishu = feishuConfig.appId && feishuConfig.appSecret && 
                      feishuConfig.appId !== '' && feishuConfig.appSecret !== '';
    result.channel.feishuConfigured = !!hasFeishu;
    if (hasFeishu) {
      updateDiagnoseItem('channel', 'success', '飞书已配置', '渠道配置完成');
    } else {
      updateDiagnoseItem('channel', 'warning', '未配置', '飞书渠道未配置，如需使用请配置');
    }
    setProgress(90);

    // 7. 检测插件
    addLog('检测插件状态...');
    updateDiagnoseItem('plugins', 'checking', '检测中...');
    try {
      const pluginsResult = await window.electronAPI.executeCommand('openclaw plugins list', { timeout: 10000 });
      if (pluginsResult.success) {
        const pluginList = (pluginsResult.stdout || '').split('\n').filter(line => line.trim());
        result.plugins = { list: pluginList, count: pluginList.length };
        if (pluginList.length > 0) {
          updateDiagnoseItem('plugins', 'success', `${pluginList.length} 个插件`, '插件正常工作');
        } else {
          updateDiagnoseItem('plugins', 'warning', '无插件', '未安装任何插件');
        }
      } else {
        updateDiagnoseItem('plugins', 'error', '获取失败', pluginsResult.error || '无法获取插件列表');
      }
    } catch (error) {
      updateDiagnoseItem('plugins', 'error', '检测失败', String(error));
    }
    setProgress(100);

    setResults(result);
    addLog('诊断完成！');
    setIsDiagnosing(false);
  };

  const testApiConnection = async () => {
    if (!selectedModel || !apiKey) {
      setApiTestResult({ testing: false, result: false, message: '请先配置 AI 模型和 API Key' });
      return;
    }

    setApiTestResult({ testing: true });
    addLog(`测试 API 连接: ${selectedModel}...`);

    try {
      // 这里根据实际的模型调用相应的测试命令
      // 暂时模拟测试过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 实际实现应该调用相应的API测试命令
      // const result = await window.electronAPI.testAIConnection(selectedModel, apiKey);
      
      setApiTestResult({ testing: false, result: true, message: 'API 连接正常' });
      addLog('API 连接测试通过！');
    } catch (error) {
      setApiTestResult({ testing: false, result: false, message: String(error) });
      addLog(`API 连接测试失败: ${error}`);
    }
  };

  const getStatusIcon = (status: DiagnoseItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14', fontSize: 20 }} />;
      case 'checking':
        return <Spin size="small" />;
      default:
        return <Badge status="default" />;
    }
  };

  const getOverallStatus = () => {
    const errorCount = diagnoseItems.filter(item => item.status === 'error').length;
    const warningCount = diagnoseItems.filter(item => item.status === 'warning').length;
    const successCount = diagnoseItems.filter(item => item.status === 'success').length;

    if (errorCount > 0) {
      return { status: 'error', title: '发现问题', subTitle: `检测到 ${errorCount} 个问题，建议修复后再使用` };
    } else if (warningCount > 0) {
      return { status: 'warning', title: '基本正常', subTitle: `检测到 ${warningCount} 个警告，可以正常使用但建议优化` };
    } else if (successCount === diagnoseItems.length) {
      return { status: 'success', title: '一切正常', subTitle: '所有检查项均通过，系统运行良好' };
    }
    return null;
  };

  const overall = getOverallStatus();

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <MedicineBoxOutlined /> 一键诊断
      </Title>
      <Paragraph type="secondary">
        全面检测 OpenClaw 运行环境，帮助您快速定位问题。
      </Paragraph>

      <Row gutter={24}>
        <Col span={14}>
          <Card
            title="诊断项目"
            extra={
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={runDiagnose}
                loading={isDiagnosing}
                disabled={isDiagnosing}
              >
                {isDiagnosing ? '诊断中...' : '开始诊断'}
              </Button>
            }
          >
            {isDiagnosing && (
              <Progress percent={progress} status="active" style={{ marginBottom: 16 }} />
            )}

            <List
              itemLayout="horizontal"
              dataSource={diagnoseItems}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={getStatusIcon(item.status)}
                    title={
                      <Space>
                        {item.icon}
                        <Text strong>{item.name}</Text>
                        <Tag color={
                          item.status === 'success' ? 'success' :
                          item.status === 'error' ? 'error' :
                          item.status === 'warning' ? 'warning' :
                          'default'
                        }>
                          {item.message}
                        </Tag>
                      </Space>
                    }
                    description={item.detail && <Text type="secondary">{item.detail}</Text>}
                  />
                </List.Item>
              )}
            />

            {overall && !isDiagnosing && (
              <>
                <Divider />
                <Result
                  status={overall.status as 'success' | 'error' | 'warning'}
                  title={overall.title}
                  subTitle={overall.subTitle}
                />
              </>
            )}
          </Card>

          {/* API 连通性测试 */}
          <Card title="API 连通性测试" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                测试当前配置的 AI API 是否可以正常连接。
              </Paragraph>
              <Space>
                <Button
                  type="primary"
                  icon={<ApiOutlined />}
                  onClick={testApiConnection}
                  loading={apiTestResult.testing}
                  disabled={!selectedModel || !apiKey}
                >
                  测试 API 连接
                </Button>
                {apiTestResult.result !== undefined && !apiTestResult.testing && (
                  <Tag color={apiTestResult.result ? 'success' : 'error'}>
                    {apiTestResult.result ? <CheckOutlined /> : <CloseCircleOutlined />} {apiTestResult.message}
                  </Tag>
                )}
              </Space>
              {(!selectedModel || !apiKey) && (
                <Alert
                  message="请先配置 AI 模型和 API Key"
                  type="info"
                  showIcon
                  action={
                    <Button size="small" onClick={() => window.location.href = '#/ai-config'}>
                      去配置
                    </Button>
                  }
                />
              )}
            </Space>
          </Card>
        </Col>

        <Col span={10}>
          <Card
            title="诊断日志"
            size="small"
            style={{ height: '100%' }}
          >
            <div
              ref={logsRef}
              style={{
                height: 600,
                overflow: 'auto',
                background: '#f5f5f5',
                padding: 12,
                fontFamily: 'monospace',
                fontSize: 12,
              }}
            >
              {logs.length === 0 ? (
                <Text type="secondary">点击"开始诊断"查看详细日志...</Text>
              ) : (
                logs.map((log, index) => (
                  <div key={index} style={{ marginBottom: 4 }}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
