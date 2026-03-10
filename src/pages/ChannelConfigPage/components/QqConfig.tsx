import { Card, Button, Space, Steps, Row, Col, Alert } from 'antd';
import { RobotOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useQqConfig } from '../hooks/useQqConfig';

const stepItems = [
  { title: '检查插件', description: '检查QQ插件是否已安装' },
  { title: '安装插件', description: '安装QQ机器人插件' },
  { title: '登录管理页', description: '打开QQ机器人管理页面' },
  { title: '创建机器人', description: '创建QQ机器人' },
  { title: '获取凭证', description: '获取AppID和AppSecret' },
  { title: '绑定配置', description: '绑定QQ机器人到OpenClaw' },
  { title: '重启服务', description: '重启OpenClaw服务' },
  { title: '完成', description: 'QQ渠道配置完成' },
];

function renderRpaProgress(progress: {step: string, status: 'pending'|'running'|'success'|'error', message?: string}[]) {
  if (progress.length === 0) return null;
  return (
    <div style={{ marginTop: 16 }}>
      {progress.map((item, index) => (
        <div key={index} style={{ 
          color: item.status === 'success' ? '#52c41a' : item.status === 'error' ? '#ff4d4f' : item.status === 'running' ? '#1890ff' : '#999',
          marginBottom: 4 
        }}>
          {item.status === 'running' ? '🔄 ' : item.status === 'success' ? '✅ ' : item.status === 'error' ? '❌ ' : '⏳ '}
          {item.step}
          {item.message && ` - ${item.message}`}
        </div>
      ))}
    </div>
  );
}

export function QqConfig() {
  const {
    currentStep,
    setCurrentStep,
    isProcessing,
    pluginInstalled,
    installLogs,
    rpaProgress,
    qqConfig,
    setQqConfig,
    handleQqAction,
    runAllSteps,
  } = useQqConfig();

  return (
    <Row gutter={24}>
      <Col span={12}>
        <Card title="步骤列表">
          <Button 
            type="primary" 
            icon={<ThunderboltOutlined />} 
            onClick={runAllSteps} 
            loading={isProcessing}
            style={{ marginBottom: 16, width: '100%' }}
          >
            一键配置
          </Button>
          <Steps
            direction="vertical"
            current={currentStep}
            items={stepItems}
            style={{ marginBottom: 16 }}
          />
          <Space>
            <Button disabled={currentStep === 0} onClick={() => setCurrentStep(prev => prev - 1)}>
              上一步
            </Button>
            <Button 
              type="primary" 
              disabled={currentStep === stepItems.length - 1 || isProcessing}
              onClick={() => setCurrentStep(prev => prev + 1)}
            >
              下一步
            </Button>
          </Space>
        </Card>
      </Col>
      <Col span={12}>
        <Card title="操作面板">
          {currentStep === 0 && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert 
                message="检查QQ插件" 
                description="检查OpenClaw中是否已安装QQ机器人插件" 
                type="info" 
                showIcon 
              />
              <Button type="primary" icon={<RobotOutlined />} onClick={() => handleQqAction('check-plugin')} loading={isProcessing}>
                检查插件
              </Button>
              {renderRpaProgress(rpaProgress)}
            </Space>
          )}
          {currentStep === 1 && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert 
                message="安装QQ插件" 
                description="执行命令: openclaw plugins install @tencent-connect/openclaw-qqbot@latest" 
                type="info" 
                showIcon 
              />
              <Button type="primary" icon={<RobotOutlined />} onClick={() => handleQqAction('install-plugin')} loading={isProcessing}>
                {pluginInstalled ? '重新安装插件' : '安装插件'}
              </Button>
              {renderRpaProgress(rpaProgress)}
              {installLogs.length > 0 && (
                <div style={{ marginTop: 10, background: '#000', color: '#fff', padding: 10, borderRadius: 4, fontFamily: 'monospace', fontSize: 12, maxHeight: 200, overflow: 'auto' }}>
                  {installLogs.map((log, index) => <div key={index}>{log}</div>)}
                </div>
              )}
            </Space>
          )}
          {currentStep === 2 && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert 
                message="登录QQ机器人管理页面" 
                description="打开 https://q.qq.com/qqbot/openclaw/index.html 进行扫码登录" 
                type="info" 
                showIcon 
              />
              <Button type="primary" icon={<RobotOutlined />} onClick={() => handleQqAction('open-console')} loading={isProcessing}>
                打开管理页面
              </Button>
              {renderRpaProgress(rpaProgress)}
            </Space>
          )}
          {currentStep === 3 && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert 
                message="创建QQ机器人" 
                description="点击创建机器人按钮，系统自动创建" 
                type="info" 
                showIcon 
              />
              <Button type="primary" icon={<RobotOutlined />} onClick={() => handleQqAction('create-robot')} loading={isProcessing}>
                自动创建机器人
              </Button>
              {renderRpaProgress(rpaProgress)}
            </Space>
          )}
          {currentStep === 4 && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert 
                message="获取AppID和AppSecret" 
                description="从页面控件自动获取机器人凭证" 
                type="info" 
                showIcon 
              />
              <Button type="primary" icon={<RobotOutlined />} onClick={() => handleQqAction('get-credentials')} loading={isProcessing}>
                自动获取凭证
              </Button>
              {qqConfig.appId && (
                <div style={{ marginTop: 8 }}>
                  <div><strong>AppID:</strong> {qqConfig.appId}</div>
                  <div><strong>AppSecret:</strong> {qqConfig.appSecret}</div>
                </div>
              )}
              {renderRpaProgress(rpaProgress)}
            </Space>
          )}
          {currentStep === 5 && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert 
                message="绑定QQ机器人" 
                description="执行命令: openclaw channels add --channel qqbot --token 'appId:appSecret'" 
                type="info" 
                showIcon 
              />
              <Button type="primary" icon={<RobotOutlined />} onClick={() => handleQqAction('bind-channel')} loading={isProcessing}>
                绑定机器人
              </Button>
              {renderRpaProgress(rpaProgress)}
            </Space>
          )}
          {currentStep === 6 && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert 
                message="重启OpenClaw服务" 
                description="执行命令: openclaw gateway restart" 
                type="info" 
                showIcon 
              />
              <Button type="primary" icon={<RobotOutlined />} onClick={() => handleQqAction('restart-service')} loading={isProcessing}>
                重启服务
              </Button>
              {renderRpaProgress(rpaProgress)}
            </Space>
          )}
          {currentStep === 7 && (
            <Alert 
              message="✅ QQ渠道配置完成！" 
              type="success" 
              showIcon 
            />
          )}
        </Card>
      </Col>
      <Col span={24} style={{ marginTop: 24 }}>
        <Card title="变量面板">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <span style={{ marginRight: 8 }}>AppID:</span>
              <input 
                value={qqConfig.appId} 
                onChange={(e) => setQqConfig({ appId: e.target.value })} 
                placeholder="请输入AppID"
                style={{ width: 300, padding: '4px 8px' }}
              />
            </div>
            <div>
              <span style={{ marginRight: 8 }}>AppSecret:</span>
              <input 
                value={qqConfig.appSecret} 
                onChange={(e) => setQqConfig({ appSecret: e.target.value })} 
                placeholder="请输入AppSecret"
                style={{ width: 300, padding: '4px 8px' }}
              />
            </div>
          </Space>
        </Card>
      </Col>
    </Row>
  );
}
