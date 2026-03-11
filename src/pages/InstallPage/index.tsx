import { useEffect, useState } from 'react';
import { Card, Typography, Space, Alert, Switch, Tooltip, Row, Col, Button } from 'antd';
import { CheckOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';
import { useInstall } from './hooks/useInstall';
import { EnvStatus } from './components/EnvStatus';
import { InstallSteps } from './components/InstallSteps';
import { ActionButtons } from './components/ActionButtons';
import { LogPanel } from './components/LogPanel';

const { Title, Text } = Typography;

export default function InstallPage() {
  const { logs, clearLogs, addLog } = useAppStore();
  const [enableGitProxy, setEnableGitProxy] = useState(false);
  const {
    isInstalling,
    currentStepIndex,
    downloadProgress,
    systemStatus,
    installSteps,
    isAllInstalled,
    checkEnvironment,
    startInstall,
    resetAllStatus,
    initConfigFile,
    downloadNodeManually,
    downloadGitManually,
    installOpenClawManually,
  } = useInstall(enableGitProxy);

  useEffect(() => {
    checkEnvironment();
    
    // 检查是否需要继续安装（重启后）
    const checkContinue = async () => {
      try {
        const result = await window.electronAPI.checkContinueInstall();
        if (result.shouldContinue) {
          // 清除标志
          await window.electronAPI.clearContinueInstall();
          // 提示用户
          addLog('检测到上次安装未完成，准备继续安装...');
          // 延迟一下让用户看到提示
          setTimeout(() => {
            startInstall();
          }, 1500);
        }
      } catch (e) {
        console.error('Check continue install error:', e);
      }
    };
    checkContinue();
  }, []);

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>一键安装 OpenClaw</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            自动检测并安装Node.js、Git等依赖环境，然后安装OpenClaw
          </Text>
        </div>
        <Space>
          <Tooltip title="开启后将Git SSH地址映射为HTTPS，解决部分网络环境下的GitHub访问问题">
            <Switch
              checked={enableGitProxy}
              onChange={setEnableGitProxy}
              checkedChildren="Git映射开启"
              unCheckedChildren="Git映射关闭"
            />
          </Tooltip>
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={startInstall}
            loading={isInstalling}
            disabled={isInstalling}
          >
            {isInstalling ? '安装中...' : (isAllInstalled() ? '重新安装' : '开始一键安装')}
          </Button>
        </Space>
      </div>
      
      <Card style={{ marginTop: 16 }} size="small">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong style={{ fontSize: 13 }}>当前环境状态：</Text>
            <Space style={{ marginLeft: 12 }} size="small">
              <EnvStatus systemStatus={systemStatus} />
            </Space>
          </div>
          


          {isAllInstalled() && (
            <Alert
              message="✅ 所有环境已准备就绪"
              description="Node.js、Git、OpenClaw 均已安装且版本符合要求"
              type="success"
              showIcon
              icon={<CheckOutlined />}
              style={{ padding: '8px 12px' }}
            />
          )}

          <Row gutter={16}>
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
            onCheckEnvironment={checkEnvironment}
            onInitConfig={initConfigFile}
            onReset={resetAllStatus}
          />
        </Space>
      </Card>
    </div>
  );
}
