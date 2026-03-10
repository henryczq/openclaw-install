import { Card, Button, Space, Steps, Row, Col, Typography, Alert } from 'antd';

const { Text } = Typography;

const stepItems = [
  { title: '安装插件', description: '安装飞书官方插件' },
  { title: '登录飞书', description: '扫码登录飞书开发者后台' },
  { title: '创建应用', description: '自动创建应用并添加机器人' },
  { title: '获取凭证', description: '自动获取 App ID / App Secret' },
  { title: '权限配置', description: '批量导入所需权限' },
  { title: '版本发布', description: '发布应用初始版本' },
  { title: '事件订阅', description: '配置事件回调' },
  { title: '保存配置', description: '确认变量并保存重启' },
  { title: '完成', description: '渠道配置完成' },
];

export function FeishuConfig() {
  const currentStep = 0;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 10, 
        backgroundColor: 'rgba(255,255,255,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16
      }}>
        <Alert
          message="功能开发未完成"
          description="飞书配置功能正在开发中，敬请期待！"
          type="warning"
          showIcon
          style={{ maxWidth: 400 }}
        />
      </div>
      <Row gutter={24}>
        <Col span={12}>
          <Card title="步骤列表">
            <Steps
              direction="vertical"
              current={currentStep}
              items={stepItems}
              style={{ marginBottom: 16 }}
            />
            <Space>
              <Button disabled>
                上一步
              </Button>
              <Button 
                type="primary" 
                disabled
              >
                下一步
              </Button>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="操作面板">
            <Text type="secondary">操作面板</Text>
          </Card>
        </Col>
        <Col span={24} style={{ marginTop: 24 }}>
          <Card>
            <Text type="secondary">变量配置面板</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
