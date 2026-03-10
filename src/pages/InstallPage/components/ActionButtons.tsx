import { Button, Space, Tooltip } from 'antd';
import { 
  PlayCircleOutlined,
  RedoOutlined,
  UpOutlined,
  FileTextOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

interface ActionButtonsProps {
  isInstalling: boolean;
  isAllInstalled: boolean;
  isCheckingUpgrade: boolean;
  isInitConfig: boolean;
  onStartInstall: () => void;
  onCheckEnvironment: () => void;
  onCheckUpgrade: () => void;
  onInitConfig: () => void;
  onReset: () => void;
}

export function ActionButtons({
  isInstalling,
  isAllInstalled,
  isCheckingUpgrade,
  isInitConfig,
  onStartInstall,
  onCheckEnvironment,
  onCheckUpgrade,
  onInitConfig,
  onReset,
}: ActionButtonsProps) {
  return (
    <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Button
        type="primary"
        size="large"
        icon={<PlayCircleOutlined />}
        onClick={onStartInstall}
        loading={isInstalling}
        disabled={isInstalling || isAllInstalled}
      >
        {isInstalling ? '安装中...' : '开始一键安装'}
      </Button>
      
      <Space>
        <Tooltip title="重新检测系统环境状态">
          <Button
            icon={<RedoOutlined />}
            onClick={onCheckEnvironment}
            disabled={isInstalling}
            size="small"
          >
            检测环境
          </Button>
        </Tooltip>
        {isAllInstalled && (
          <Tooltip title="检查 OpenClaw 是否有新版本">
            <Button
              icon={<UpOutlined />}
              onClick={onCheckUpgrade}
              loading={isCheckingUpgrade}
              disabled={isCheckingUpgrade}
              size="small"
            >
              {isCheckingUpgrade ? '检测中...' : '检测升级'}
            </Button>
          </Tooltip>
        )}
        <Tooltip title="清空并重新生成OpenClaw配置文件">
          <Button
            icon={<FileTextOutlined />}
            onClick={onInitConfig}
            loading={isInitConfig}
            disabled={isInstalling}
            size="small"
          >
            初始化配置
          </Button>
        </Tooltip>
        <Tooltip title="重置所有状态，用于重新测试">
          <Button
            icon={<DeleteOutlined />}
            onClick={onReset}
            disabled={isInstalling}
            danger
            size="small"
          >
            重置状态
          </Button>
        </Tooltip>
      </Space>
    </div>
  );
}
