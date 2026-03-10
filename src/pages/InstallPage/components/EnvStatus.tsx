import { Space, Tag } from 'antd';
import type { SystemStatus } from '../../../types';

interface EnvStatusProps {
  systemStatus: SystemStatus;
}

export function EnvStatus({ systemStatus }: EnvStatusProps) {
  return (
    <Space>
      <Tag color={systemStatus.node.installed ? (systemStatus.node.needUpdate ? 'orange' : 'green') : 'red'}>
        Node.js {systemStatus.node.installed ? `v${systemStatus.node.version}` : '未安装'}
      </Tag>
      <Tag color={systemStatus.npm.installed ? 'green' : 'red'}>
        npm {systemStatus.npm.installed ? `v${systemStatus.npm.version}` : '未安装'}
      </Tag>
      <Tag color={systemStatus.git.installed ? (systemStatus.git.needUpdate ? 'orange' : 'green') : 'red'}>
        Git {systemStatus.git.installed ? `v${systemStatus.git.version}` : '未安装'}
      </Tag>
      <Tag color={systemStatus.openclaw.installed ? 'green' : 'red'}>
        OpenClaw {systemStatus.openclaw.installed ? '已安装' : '未安装'}
      </Tag>
    </Space>
  );
}
