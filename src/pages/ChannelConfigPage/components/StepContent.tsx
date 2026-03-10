import { Space, Button, Alert, Typography, Input, Card, List, Tag } from 'antd';
import { RobotOutlined, LoadingOutlined, CheckOutlined, CloseOutlined, LinkOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface StepContentProps {
  currentStep: number;
  isProcessing: boolean;
  pluginInstalled: boolean;
  installLogs: string[];
  feishuConfig: { appName: string; appDesc: string; appId: string; appSecret: string };
  setFeishuConfig: (config: Partial<{ appName: string; appDesc: string; appId: string; appSecret: string }>) => void;
  rpaProgress: {step: string, status: 'pending'|'running'|'success'|'error', message?: string}[];
  onInstallPlugin: () => void;
  onRpaAction: (action: string) => void;
  onSaveConfig: () => void;
}

export function StepContent({
  currentStep,
  isProcessing,
  pluginInstalled,
  installLogs,
  feishuConfig,
  setFeishuConfig,
  rpaProgress,
  onInstallPlugin,
  onRpaAction,
  onSaveConfig,
}: StepContentProps) {
  const renderRpaProgress = () => (
    <Card size="small" style={{ marginTop: 16, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
      {rpaProgress.length === 0 ? (
        <Text type="secondary">点击上方按钮后展示详细步骤</Text>
      ) : (
        <List
          size="small"
          dataSource={rpaProgress}
          renderItem={(item) => (
            <List.Item style={{ padding: '4px 0' }}>
              <Space>
                <span style={{ width: 24, textAlign: 'center' }}>
                  {item.status === 'pending' && <span style={{ color: '#999' }}>○</span>}
                  {item.status === 'running' && <LoadingOutlined style={{ color: '#1890ff' }} />}
                  {item.status === 'success' && <CheckOutlined style={{ color: '#52c41a' }} />}
                  {item.status === 'error' && <CloseOutlined style={{ color: '#ff4d4f' }} />}
                </span>
                <span style={{ 
                  color: item.status === 'error' ? '#ff4d4f' : 
                         item.status === 'success' ? '#52c41a' : 
                         item.status === 'running' ? '#1890ff' : '#999'
                }}>
                  {item.step}
                </span>
                {item.message && <Tag color={item.status === 'error' ? 'error' : 'success'}>{item.message}</Tag>}
              </Space>
            </List.Item>
          )}
        />
      )}
    </Card>
  );

  switch (currentStep) {
    case 0:
      return (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>首先需要安装飞书官方插件，这是连接飞书平台的必要组件。</Text>
          <Alert 
            message="后台执行操作" 
            description={<Text code style={{ fontSize: 12 }}>npx -y feishu-plugin install</Text>} 
            type="info" 
          />
          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={onInstallPlugin}
            loading={isProcessing}
            disabled={pluginInstalled}
          >
            {pluginInstalled ? '已安装' : '一键安装飞书插件'}
          </Button>
          {pluginInstalled && <Alert message="插件安装成功" type="success" showIcon />}
          {renderRpaProgress()}
          {(isProcessing || installLogs.length > 0) && (
            <div style={{ 
              marginTop: 10, background: '#000', color: '#fff', padding: 10, 
              borderRadius: 4, fontFamily: 'monospace', fontSize: 12,
              maxHeight: 200, overflow: 'auto'
            }}>
              {installLogs.map((log, index) => <div key={index}>{log}</div>)}
              {isProcessing && <div>_</div>}
            </div>
          )}
        </Space>
      );
    case 1:
      return (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>请点击按钮打开飞书开发者后台，并在弹出的窗口中扫码登录。</Text>
          <Alert message="将自动打开 open.feishu.cn" type="info" showIcon />
          <Button type="primary" icon={<LinkOutlined />} onClick={() => onRpaAction('login')} loading={isProcessing}>
            登录飞书
          </Button>
          {renderRpaProgress()}
        </Space>
      );
    case 2:
      return (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>即将自动执行：点击创建应用 → 填写信息(openclaw) → 添加机器人能力。</Text>
          <Alert message="请保持飞书后台窗口在前台显示，不要进行鼠标操作" type="warning" showIcon />
          <Space>
            <Input
              value={feishuConfig.appName}
              onChange={(e) => setFeishuConfig({ appName: e.target.value })}
              placeholder="应用名称"
              style={{ width: 200 }}
            />
            <Input
              value={feishuConfig.appDesc}
              onChange={(e) => setFeishuConfig({ appDesc: e.target.value })}
              placeholder="应用描述"
              style={{ width: 300 }}
            />
          </Space>
          <Button type="primary" icon={<RobotOutlined />} onClick={() => onRpaAction('create-app')} loading={isProcessing}>
            开始自动创建
          </Button>
          {renderRpaProgress()}
        </Space>
      );
    case 3:
      return (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>即将自动执行：点击左侧菜单“凭证与基础信息” → 复制 App ID / App Secret → 回填右侧变量。</Text>
          <Button type="primary" icon={<RobotOutlined />} onClick={() => onRpaAction('get-credentials')} loading={isProcessing}>
            自动获取凭证
          </Button>
          {renderRpaProgress()}
        </Space>
      );
    case 4:
      return (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>即将自动执行：进入权限管理 → 批量导入权限 → 申请开通。</Text>
          <Button type="primary" icon={<RobotOutlined />} onClick={() => onRpaAction('config-permissions')} loading={isProcessing}>
            自动配置权限
          </Button>
          {renderRpaProgress()}
        </Space>
      );
    case 5:
      return (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>即将自动执行：创建版本 1.0.0 → 保存 → 发布。</Text>
          <Button type="primary" icon={<RobotOutlined />} onClick={() => onRpaAction('publish-version')} loading={isProcessing}>
            自动发布版本
          </Button>
          {renderRpaProgress()}
        </Space>
      );
    case 6:
      return (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>即将自动执行：配置事件订阅 → 添加 im.message.receive_v1 事件。</Text>
          <Button type="primary" icon={<RobotOutlined />} onClick={() => onRpaAction('subscribe-events')} loading={isProcessing}>
            自动订阅事件
          </Button>
          {renderRpaProgress()}
        </Space>
      );
    case 7:
      return (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>请在右侧变量面板确认 App ID 和 App Secret，支持手动输入。</Text>
          <Space>
            <Input
              value={feishuConfig.appId}
              onChange={(e) => setFeishuConfig({ appId: e.target.value })}
              placeholder="App ID"
              style={{ width: 200 }}
            />
            <Input
              value={feishuConfig.appSecret}
              onChange={(e) => setFeishuConfig({ appSecret: e.target.value })}
              placeholder="App Secret"
              style={{ width: 300 }}
            />
          </Space>
          <Button type="primary" onClick={onSaveConfig} loading={isProcessing}>
            保存配置
          </Button>
          {renderRpaProgress()}
        </Space>
      );
    case 8:
      return (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert message="✅ 飞书渠道配置完成！" type="success" showIcon />
          <Text>您的飞书机器人已配置完成，可以开始使用了。</Text>
        </Space>
      );
    default:
      return null;
  }
}
