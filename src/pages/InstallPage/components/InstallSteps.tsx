import { Steps, Space, Tag, Typography, Progress, Button } from 'antd';
import { 
  CheckCircleOutlined, 
  LoadingOutlined, 
  CloseCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { InstallStep, SystemStatus } from '../../../types';

const { Text } = Typography;

interface InstallStepsProps {
  installSteps: InstallStep[];
  currentStepIndex: number;
  systemStatus: SystemStatus;
  downloadProgress: {[key: string]: number};
  onDownloadNode: () => void;
  onDownloadGit: () => void;
  onInstallOpenClaw: () => void;
}

export function InstallSteps({
  installSteps,
  currentStepIndex,
  systemStatus,
  downloadProgress,
  onDownloadNode,
  onDownloadGit,
  onInstallOpenClaw,
}: InstallStepsProps) {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'running':
        return <LoadingOutlined style={{ color: '#1890ff' }} spin />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  return (
    <Steps
      direction="vertical"
      current={currentStepIndex}
      items={installSteps.map((step) => ({
        title: (
          <Space>
            {step.title}
            {step.id === 'install-node' && systemStatus.node.installed && systemStatus.node.version && (
              <Tag color="success">v{systemStatus.node.version}</Tag>
            )}
            {step.id === 'install-git' && systemStatus.git.installed && systemStatus.git.version && (
              <Tag color="success">v{systemStatus.git.version}</Tag>
            )}
            {step.id === 'install-openclaw' && systemStatus.openclaw.installed && systemStatus.openclaw.version && (
              <Tag color="success">v{systemStatus.openclaw.version}</Tag>
            )}
            {step.id === 'init-config' && systemStatus.openclaw.installed && (
              <Tag color="processing">配置中</Tag>
            )}
            {step.id === 'start-gateway' && systemStatus.openclaw.installed && (
              <Tag color="processing">启动中</Tag>
            )}
            {step.id === 'install-node' && (step.status === 'error' || step.status === 'pending') && (
              <Button size="small" icon={<DownloadOutlined />} onClick={onDownloadNode}>
                手动下载
              </Button>
            )}
            {step.id === 'install-git' && (step.status === 'error' || step.status === 'pending') && (
              <Button size="small" icon={<DownloadOutlined />} onClick={onDownloadGit}>
                手动下载
              </Button>
            )}
            {step.id === 'install-openclaw' && (step.status === 'error' || step.status === 'pending') && (
              <Button size="small" icon={<DownloadOutlined />} onClick={onInstallOpenClaw}>
                手动安装
              </Button>
            )}
            {getStepIcon(step.status)}
          </Space>
        ),
        description: (
          <div>
            <Text type="secondary">{step.description}</Text>
            {step.message && (
              <div style={{ marginTop: 4 }}>
                <Text type={step.status === 'error' ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
                  {step.message}
                </Text>
              </div>
            )}
            {step.id === 'install-vcredist' && downloadProgress.vcredist !== undefined && downloadProgress.vcredist < 100 && (
              <div style={{ marginTop: 8, width: 200 }}>
                <Progress percent={downloadProgress.vcredist} size="small" status="active" />
              </div>
            )}
            {step.id === 'install-node' && downloadProgress.node !== undefined && downloadProgress.node < 100 && (
              <div style={{ marginTop: 8, width: 200 }}>
                <Progress percent={downloadProgress.node} size="small" status="active" />
              </div>
            )}
            {step.id === 'install-git' && downloadProgress.git !== undefined && downloadProgress.git < 100 && (
              <div style={{ marginTop: 8, width: 200 }}>
                <Progress percent={downloadProgress.git} size="small" status="active" />
              </div>
            )}
          </div>
        ),
      }))}
    />
  );
}
