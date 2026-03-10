import { Card, Space, Input, Typography } from 'antd';

const { Text } = Typography;

interface VariablesPanelProps {
  feishuConfig: {
    appName: string;
    appDesc: string;
    appId: string;
    appSecret: string;
  };
  setFeishuConfig: (config: Partial<{
    appName: string;
    appDesc: string;
    appId: string;
    appSecret: string;
  }>) => void;
}

export function VariablesPanel({ feishuConfig, setFeishuConfig }: VariablesPanelProps) {
  return (
    <Card size="small" title="变量" style={{ width: '100%' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text type="secondary">应用</Text>
        <Input
          value={feishuConfig.appName}
          onChange={(e) => setFeishuConfig({ appName: e.target.value })}
          placeholder="应用名称（例如 openclaw）"
          allowClear
        />
        <Input.TextArea
          value={feishuConfig.appDesc}
          onChange={(e) => setFeishuConfig({ appDesc: e.target.value })}
          placeholder="应用描述"
          rows={3}
          allowClear
        />

        <Text type="secondary" style={{ marginTop: 8 }}>凭证</Text>
        <Input
          value={feishuConfig.appId}
          onChange={(e) => setFeishuConfig({ appId: e.target.value })}
          placeholder="App ID"
          allowClear
        />
        <Input
          value={feishuConfig.appSecret}
          onChange={(e) => setFeishuConfig({ appSecret: e.target.value })}
          placeholder="App Secret"
          allowClear
        />
      </Space>
    </Card>
  );
}
