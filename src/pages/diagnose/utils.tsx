import { Badge, Spin } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
  MessageOutlined,
  RobotOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { DiagnoseItem, OverallDiagnoseStatus } from './types';

export function createInitialDiagnoseItems(): DiagnoseItem[] {
  return [
    { id: 'node', name: 'Node.js 环境', status: 'pending', message: '等待检测', icon: <GlobalOutlined /> },
    { id: 'npm', name: 'NPM 环境', status: 'pending', message: '等待检测', icon: <GlobalOutlined /> },
    { id: 'openclaw', name: 'OpenClaw 安装', status: 'pending', message: '等待检测', icon: <RobotOutlined /> },
    { id: 'gateway', name: 'OpenClaw 网关', status: 'pending', message: '等待检测', icon: <GlobalOutlined /> },
    { id: 'ai', name: 'AI 配置', status: 'pending', message: '等待检测', icon: <RobotOutlined /> },
    { id: 'channel', name: '渠道配置', status: 'pending', message: '等待检测', icon: <MessageOutlined /> },
    { id: 'plugins', name: '插件状态', status: 'pending', message: '等待检测', icon: <ToolOutlined /> },
  ];
}

export function getDiagnoseStatusIcon(status: DiagnoseItem['status']) {
  switch (status) {
    case 'success':
      return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
    case 'error':
      return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />;
    case 'warning':
      return <WarningOutlined style={{ color: '#faad14', fontSize: 20 }} />;
    case 'checking':
      return <Spin size="small" />;
    default:
      return <Badge status="default" />;
  }
}

export function getOverallDiagnoseStatus(items: DiagnoseItem[]): OverallDiagnoseStatus | null {
  const errorCount = items.filter((item) => item.status === 'error').length;
  const warningCount = items.filter((item) => item.status === 'warning').length;
  const successCount = items.filter((item) => item.status === 'success').length;

  if (errorCount > 0) {
    return { status: 'error', title: '发现问题', subTitle: `检测到 ${errorCount} 个问题，建议修复后再使用` };
  }
  if (warningCount > 0) {
    return { status: 'warning', title: '基本正常', subTitle: `检测到 ${warningCount} 个警告，可以正常使用但建议优化` };
  }
  if (successCount === items.length) {
    return { status: 'success', title: '一切正常', subTitle: '所有检查项均通过，系统运行良好' };
  }
  return null;
}
