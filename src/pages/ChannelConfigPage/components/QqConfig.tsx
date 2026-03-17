import { Card, Button, Space, Steps, Row, Col, Alert, Spin, Typography, Radio } from 'antd';
import { RobotOutlined, ThunderboltOutlined, ReadOutlined } from '@ant-design/icons';
import { useQqConfig } from '../hooks/useQqConfig';
import { useEffect, useRef } from 'react';

const { Text } = Typography;

// 实时日志显示组件
function LogViewer({ logs }: { logs: string[] }) {
  const logEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // 自动滚动到底部
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);
  
  if (logs.length === 0) return null;
  
  return (
    <div style={{ 
      marginTop: 10, 
      background: '#1e1e1e', 
      color: '#d4d4d4', 
      padding: 10, 
      borderRadius: 4, 
      fontFamily: 'Consolas, Monaco, monospace', 
      fontSize: 12, 
      maxHeight: 300, 
      overflow: 'auto',
      border: '1px solid #333'
    }}>
      <div style={{ color: '#6cc644', marginBottom: 8, fontWeight: 'bold' }}>
        📋 实时日志 ({logs.length} 条)
      </div>
      {logs.map((log, index) => (
        <div key={index} style={{ 
          marginBottom: 2,
          color: log.includes('错误') || log.includes('失败') || log.includes('❌') ? '#ff6b6b' : 
                 log.includes('成功') || log.includes('✅') ? '#6cc644' :
                 log.includes('调试') || log.includes('===') ? '#ffd93d' : '#d4d4d4'
        }}>
          {log}
        </div>
      ))}
      <div ref={logEndRef} />
    </div>
  );
}

// 创建机器人模式的步骤
const createStepItems = [
  { title: '检查插件', description: '检查QQ插件是否已安装' },
  { title: '安装插件', description: '安装QQ机器人插件' },
  { title: '登录管理页', description: '打开QQ机器人管理页面' },
  { title: '创建机器人', description: '创建QQ机器人' },
  { title: '获取凭证', description: '获取AppID和AppSecret' },
  { title: '绑定配置', description: '绑定QQ机器人到OpenClaw' },
  { title: '重启服务', description: '重启OpenClaw服务' },
  { title: '完成', description: 'QQ渠道配置完成' },
];

// 读取配置模式的步骤（跳过创建机器人）
const readStepItems = [
  { title: '检查插件', description: '检查QQ插件是否已安装' },
  { title: '安装插件', description: '安装QQ机器人插件' },
  { title: '登录管理页', description: '打开QQ机器人管理页面' },
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
    handleQqAction,
    runAllSteps,
    runReadConfigSteps,
    openclawInstalled,
    isCheckingOpenclaw,
    configMode,
    setConfigMode,
  } = useQqConfig();

  const stepItems = configMode === 'create' ? createStepItems : readStepItems;

  if (isCheckingOpenclaw) {
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
          description="请先在一键安装页面安装 OpenClaw，然后再配置 QQ 渠道。"
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <Row gutter={24}>
      <Col span={12}>
        <Card title="配置模式">
          <Radio.Group 
            value={configMode} 
            onChange={(e) => setConfigMode(e.target.value)}
            style={{ marginBottom: 16, width: '100%' }}
            buttonStyle="solid"
          >
            <Radio.Button value="create" style={{ width: '50%', textAlign: 'center' }}>
              <RobotOutlined /> 一键创建机器人
            </Radio.Button>
            <Radio.Button value="read" style={{ width: '50%', textAlign: 'center' }}>
              <ReadOutlined /> 一键读取配置
            </Radio.Button>
          </Radio.Group>
          
          <Alert
            message={configMode === 'create' ? '一键创建机器人' : '一键读取配置'}
            description={
              configMode === 'create' 
                ? '完整流程：自动创建新的QQ机器人并配置到OpenClaw' 
                : '快速流程：读取已创建的QQ机器人配置到OpenClaw（跳过创建步骤）'
            }
            type={configMode === 'create' ? 'info' : 'success'}
            showIcon
            style={{ marginBottom: 16 }}
          />

          {configMode === 'create' ? (
            <Button 
              type="primary" 
              icon={<ThunderboltOutlined />} 
              onClick={runAllSteps} 
              loading={isProcessing}
              style={{ marginBottom: 16, width: '100%' }}
            >
              一键创建机器人
            </Button>
          ) : (
            <Button 
              type="primary" 
              icon={<ReadOutlined />} 
              onClick={runReadConfigSteps} 
              loading={isProcessing}
              style={{ marginBottom: 16, width: '100%' }}
            >
              一键读取配置
            </Button>
          )}
          
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
              <LogViewer logs={installLogs} />
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
              <LogViewer logs={installLogs} />
            </Space>
          )}
          {currentStep === 2 && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert 
                message="登录QQ机器人管理页面" 
                description="打开 https://q.qq.com/qqbot/openclaw/index.html 进行扫码登录，系统将在后台自动检测登录状态（每5秒检查一次，最多2分钟），检测到登录后会自动继续" 
                type="info" 
                showIcon 
              />
              <Button type="primary" icon={<RobotOutlined />} onClick={() => handleQqAction('open-console')} loading={isProcessing}>
                打开管理页面
              </Button>
              <Button type="default" icon={<RobotOutlined />} onClick={() => handleQqAction('check-login')} loading={isProcessing} disabled={isProcessing}>
                已登录，手动继续
              </Button>
              <Text type="secondary" style={{ fontSize: 12 }}>
                如果自动检测未触发，可点击"已登录，手动继续"
              </Text>
              {renderRpaProgress(rpaProgress)}
              <LogViewer logs={installLogs} />
            </Space>
          )}
          {configMode === 'create' && currentStep === 3 && (
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
              <LogViewer logs={installLogs} />
            </Space>
          )}
          {((configMode === 'create' && currentStep === 4) || (configMode === 'read' && currentStep === 3)) && (
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
              <LogViewer logs={installLogs} />
            </Space>
          )}
          {((configMode === 'create' && currentStep === 5) || (configMode === 'read' && currentStep === 4)) && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert 
                message="绑定QQ机器人" 
                description="将获取到的凭证绑定到OpenClaw配置中" 
                type="info" 
                showIcon 
              />
              <Button 
                type="primary" 
                icon={<RobotOutlined />} 
                onClick={() => handleQqAction('bind-channel')} 
                loading={isProcessing}
                disabled={!qqConfig.appId || !qqConfig.appSecret}
              >
                绑定机器人
              </Button>
              {!qqConfig.appId && (
                <Text type="warning" style={{ fontSize: 12 }}>
                  请先获取AppID和AppSecret
                </Text>
              )}
              {renderRpaProgress(rpaProgress)}
              <LogViewer logs={installLogs} />
            </Space>
          )}
          {((configMode === 'create' && currentStep === 6) || (configMode === 'read' && currentStep === 5)) && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert 
                message="重启OpenClaw服务" 
                description="重启服务使配置生效" 
                type="info" 
                showIcon 
              />
              <Button type="primary" icon={<RobotOutlined />} onClick={() => handleQqAction('restart-service')} loading={isProcessing}>
                重启服务
              </Button>
              {renderRpaProgress(rpaProgress)}
              <LogViewer logs={installLogs} />
            </Space>
          )}
          {((configMode === 'create' && currentStep === 7) || (configMode === 'read' && currentStep === 6)) && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert 
                message="配置完成" 
                description="QQ渠道配置已完成！" 
                type="success" 
                showIcon 
              />
              <div style={{ marginTop: 16 }}>
                <h4>配置信息：</h4>
                <p><strong>AppID:</strong> {qqConfig.appId}</p>
                <p><strong>AppSecret:</strong> {qqConfig.appSecret || '未设置'}</p>
              </div>
            </Space>
          )}
        </Card>
      </Col>
    </Row>
  );
}
