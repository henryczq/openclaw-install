import { Alert, Button, Card, Space, Tag, Typography } from 'antd';
import { ApiOutlined, CheckOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ApiTestResult } from '../types';

const { Paragraph } = Typography;

interface ApiConnectionCardProps {
  canTestApi: boolean;
  apiTestResult: ApiTestResult;
  onTestConnection: () => void;
}

export function ApiConnectionCard({
  canTestApi,
  apiTestResult,
  onTestConnection,
}: ApiConnectionCardProps) {
  return (
    <Card title="API 连通性测试" style={{ marginTop: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Paragraph>
          测试当前配置的 AI API 是否可以正常连接。
        </Paragraph>
        <Space>
          <Button
            type="primary"
            icon={<ApiOutlined />}
            onClick={onTestConnection}
            loading={apiTestResult.testing}
            disabled={!canTestApi}
          >
            测试 API 连接
          </Button>
          {apiTestResult.result !== undefined && !apiTestResult.testing && (
            <Tag color={apiTestResult.result ? 'success' : 'error'}>
              {apiTestResult.result ? <CheckOutlined /> : <CloseCircleOutlined />} {apiTestResult.message}
            </Tag>
          )}
        </Space>
        {!canTestApi && (
          <Alert
            message="请先配置 AI 模型和 API Key"
            type="info"
            showIcon
            action={(
              <Button size="small" onClick={() => { window.location.href = '#/ai-config'; }}>
                去配置
              </Button>
            )}
          />
        )}
      </Space>
    </Card>
  );
}
