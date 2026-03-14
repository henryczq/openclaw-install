import { Card, Button, Space, Row, Col, Alert, Spin, Typography } from 'antd';
import { ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useFeishuConfig } from '../hooks/useFeishuConfig';

const { Text, Paragraph } = Typography;

export function FeishuConfig() {
  const {
    isProcessing,
    installLogs,
    isChecking,
    openclawInstalled,
    installComplete,
    installFeishuPlugin,
  } = useFeishuConfig();

  if (isChecking) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', marginTop: 100 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>正在检查 OpenClaw 安装状态...</div>
      </div>
    );
  }

  if (openclawInstalled === false) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="OpenClaw 未安装"
          description="请先在一键安装页面安装 OpenClaw，然后再配置飞书渠道。"
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <Row gutter={24}>
      <Col span={24}>
        <Card title="飞书配置">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Alert
              message="配置说明"
              description={
                <div>
                  <Paragraph style={{ marginBottom: 8 }}>
                    点击下方按钮将自动执行飞书官方配置工具：
                  </Paragraph>
                  <Text code>echo n | npx -y @larksuite/openclaw-lark-tools install</Text>
                  <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                    执行过程中会自动处理交互确认（自动选择 n），请耐心等待。
                  </Paragraph>
                </div>
              }
              type="info"
              showIcon
            />

            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={installFeishuPlugin}
              loading={isProcessing}
              disabled={installComplete}
              size="large"
              style={{ width: '100%' }}
            >
              {installComplete ? '配置完成' : '开始配置飞书'}
            </Button>

            {installComplete && (
              <Alert
                message="飞书配置已完成"
                description="配置已成功完成，飞书渠道已可用。"
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            )}

            {installLogs.length > 0 && (
              <div
                style={{
                  background: '#1e1e1e',
                  color: '#d4d4d4',
                  padding: 12,
                  borderRadius: 6,
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontSize: 12,
                  maxHeight: 400,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {installLogs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
                {isProcessing && <span style={{ animation: 'blink 1s infinite' }}>▌</span>}
              </div>
            )}
          </Space>
        </Card>
      </Col>
    </Row>
  );
}
