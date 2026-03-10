import { useEffect, useState } from 'react';
import { Card, Typography, Space, Alert, Switch, Tooltip, Row, Col } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';
import { useInstall } from './hooks/useInstall';
import { EnvStatus } from './components/EnvStatus';
import { InstallSteps } from './components/InstallSteps';
import { ActionButtons } from './components/ActionButtons';
import { LogPanel } from './components/LogPanel';

const { Title, Text } = Typography;

export default function InstallPage() {
  const { logs, clearLogs } = useAppStore();
  const [isDebugMode, setIsDebugMode] = useState(false);
  const {
    isInstalling,
    currentStepIndex,
    isCheckingUpgrade,
    downloadProgress,
    isInitConfig,
    systemStatus,
    installSteps,
    isAllInstalled,
    checkEnvironment,
    startInstall,
    checkUpgrade,
    resetAllStatus,
    initConfigFile,
    downloadNodeManually,
    downloadGitManually,
    installOpenClawManually,
  } = useInstall(isDebugMode);

  useEffect(() => {
    checkEnvironment();
    // 检查 DEBUG 模式
    const checkDebug = async () => {
      try {
        const result = await window.electronAPI?.getDebugStatus?.();
        if (result) {
          setIsDebugMode(result.enabled);
        }
      } catch (e) {
        console.log('DEBUG 模式检查失败:', e);
      }
    };
    checkDebug();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2}>一键安装 OpenClaw</Title>
          <Text type="secondary">
            自动检测并安装Node.js、Git等依赖环境，然后安装OpenClaw
          </Text>
        </div>
        {isDebugMode && (
          <Tooltip title="开启后不会真正安装软件，仅模拟安装流程">
            <Switch
              checked={isDebugMode}
              onChange={setIsDebugMode}
              checkedChildren="模拟模式"
              unCheckedChildren="真实模式"
            />
          </Tooltip>
        )}
      </div>
      
      <Card style={{ marginTop: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong>当前环境状态：</Text>
            <Space style={{ marginLeft: 16 }}>
              <EnvStatus systemStatus={systemStatus} />
            </Space>
          </div>
          
          {isDebugMode && (
            <Alert
              message="🧪 模拟模式已开启"
              description="不会真正安装软件，仅模拟安装流程用于测试UI和流程"
              type="warning"
              showIcon
            />
          )}

          {isAllInstalled() && (
            <Alert
              message="✅ 所有环境已准备就绪"
              description="Node.js、Git、OpenClaw 均已安装且版本符合要求"
              type="success"
              showIcon
              icon={<CheckOutlined />}
            />
          )}

          <Row gutter={24}>
            <Col span={14}>
              <InstallSteps
                installSteps={installSteps}
                currentStepIndex={currentStepIndex}
                downloadProgress={downloadProgress}
                systemStatus={systemStatus}
                onDownloadNode={downloadNodeManually}
                onDownloadGit={downloadGitManually}
                onInstallOpenClaw={installOpenClawManually}
              />
            </Col>
            <Col span={10}>
              <LogPanel
                logs={logs}
                onClear={clearLogs}
              />
            </Col>
          </Row>

          <ActionButtons
            isInstalling={isInstalling}
            isCheckingUpgrade={isCheckingUpgrade}
            isInitConfig={isInitConfig}
            isAllInstalled={isAllInstalled()}
            onStartInstall={startInstall}
            onCheckEnvironment={checkEnvironment}
            onCheckUpgrade={checkUpgrade}
            onInitConfig={initConfigFile}
            onReset={resetAllStatus}
          />
        </Space>
      </Card>
    </div>
  );
}
