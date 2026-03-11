import { Button, Space, Tooltip } from 'antd';
import { 
  RedoOutlined,
  FileTextOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

interface ActionButtonsProps {
  isInstalling: boolean;
  onCheckEnvironment: () => void;
  onInitConfig: () => void;
  onReset: () => void;
}

export function ActionButtons({
  isInstalling,
  onCheckEnvironment,
  onInitConfig,
  onReset,
}: ActionButtonsProps) {
  return (
    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
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
        <Tooltip title="清空并重新生成OpenClaw配置文件">
          <Button
            icon={<FileTextOutlined />}
            onClick={onInitConfig}
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
