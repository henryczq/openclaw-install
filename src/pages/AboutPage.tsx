import { Card, Typography, Space, Tag, Divider, Button } from 'antd';
import { GithubOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function AboutPage() {
  const appVersion = '1.0.0';

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>关于</Title>
      
      <Card style={{ marginTop: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 应用信息 */}
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Title level={3} style={{ marginBottom: 8 }}>
              OpenClaw 安装助手
              <Button 
                type="link" 
                size="small"
                icon={<GithubOutlined />}
                onClick={() => window.electronAPI?.openExternal('https://github.com/henryczq/openclaw-install')}
                style={{ marginLeft: 8 }}
              >
                GitHub
              </Button>
            </Title>
            <Tag color="blue">v{appVersion}</Tag>
            <Paragraph style={{ marginTop: 16, color: '#666' }}>
              一款面向 Windows 平台的桌面客户端软件，<br />
              帮助用户零门槛、一键式完成 OpenClaw 的部署和配置。
            </Paragraph>
          </div>

          <Divider />

          {/* 功能特性和作者信息 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Text strong>功能特性：</Text>
              <ul style={{ marginTop: 8, color: '#666' }}>
                <li>自动检测并安装 Node.js、Git 等依赖环境</li>
                <li>一键安装 OpenClaw 主程序</li>
                <li>AI 模型配置（支持火山引擎、KIMI、自定义）</li>
                <li>飞书渠道配置向导</li>
                <li>可视化安装日志</li>
                <li>完整的卸载功能</li>
              </ul>
            </div>
            <div style={{ marginLeft: 32, padding: '16px', background: '#f5f5f5', borderRadius: '8px', minWidth: '150px' }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>作者信息</Text>
              <Text type="secondary" style={{ fontSize: 14 }}>
                振振公子
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                henryczq
              </Text>
            </div>
          </div>

          <Divider />

          {/* 版权信息 */}
          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            <Text type="secondary">
              2026 OpenClaw Installer. All rights reserved.
            </Text>
            <br />
            <Text type="secondary">
              本软件仅供学习和研究使用
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}
