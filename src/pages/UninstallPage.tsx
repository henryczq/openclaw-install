import { useState } from 'react';
import { Card, Typography, Button, Space, Alert, Modal, List, Tag } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAppStore } from '../store';

const { Title, Text } = Typography;
const { confirm } = Modal;

export default function UninstallPage() {
  const { systemStatus, setSystemStatus, addLog } = useAppStore();
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [uninstallResult, setUninstallResult] = useState<'idle' | 'success' | 'error'>('idle');

  const showUninstallConfirm = () => {
    confirm({
      title: '确认卸载OpenClaw？',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>此操作将卸载OpenClaw，包括：</p>
          <ul>
            <li>OpenClaw主程序</li>
            <li>相关npm全局包</li>
            <li>配置文件（可选）</li>
          </ul>
          <p>Node.js和Git将保留。</p>
        </div>
      ),
      okText: '确认卸载',
      okType: 'danger',
      cancelText: '取消',
      onOk: handleUninstall,
    });
  };

  const handleUninstall = async () => {
    setIsUninstalling(true);
    setUninstallResult('idle');
    addLog('开始卸载OpenClaw...');

    try {
      const result = await window.electronAPI.uninstallOpenClaw();
      if (result.success) {
        setUninstallResult('success');
        addLog('OpenClaw卸载成功');
        // 更新状态
        const checkResult = await window.electronAPI.checkOpenClaw();
        setSystemStatus({ openclaw: checkResult });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setUninstallResult('error');
      addLog(`OpenClaw卸载失败: ${error}`);
    } finally {
      setIsUninstalling(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>卸载 OpenClaw</Title>
      <Text type="secondary">
        从系统中移除OpenClaw及其相关组件
      </Text>

      <Card style={{ marginTop: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 当前安装状态 */}
          <div>
            <Text strong>当前安装状态：</Text>
            <Tag 
              color={systemStatus.openclaw.installed ? 'green' : 'red'}
              style={{ marginLeft: 8 }}
            >
              {systemStatus.openclaw.installed 
                ? `已安装 ${systemStatus.openclaw.version || ''}` 
                : '未安装'}
            </Tag>
          </div>

          {/* 卸载说明 */}
          <Card type="inner" title="卸载说明" size="small">
            <List size="small">
              <List.Item>
                <Text>卸载将删除OpenClaw主程序和相关npm全局包</Text>
              </List.Item>
              <List.Item>
                <Text>Node.js和Git不会被卸载</Text>
              </List.Item>
              <List.Item>
                <Text>飞书应用需要在飞书开发者后台手动删除</Text>
              </List.Item>
              <List.Item>
                <Text>卸载后可以通过安装页面重新安装</Text>
              </List.Item>
            </List>
          </Card>

          {/* 卸载按钮 */}
          <Button
            type="primary"
            danger
            size="large"
            icon={<DeleteOutlined />}
            onClick={showUninstallConfirm}
            loading={isUninstalling}
            disabled={!systemStatus.openclaw.installed || isUninstalling}
          >
            {isUninstalling ? '卸载中...' : '卸载OpenClaw'}
          </Button>

          {/* 卸载结果 */}
          {uninstallResult === 'success' && (
            <Alert
              message="卸载成功"
              description="OpenClaw已成功从系统中移除"
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          )}
          {uninstallResult === 'error' && (
            <Alert
              message="卸载失败"
              description="卸载过程中出现错误，请查看日志"
              type="error"
              showIcon
            />
          )}

          {!systemStatus.openclaw.installed && uninstallResult === 'idle' && (
            <Alert
              message="OpenClaw未安装"
              description="系统中未检测到OpenClaw，无需卸载"
              type="info"
              showIcon
            />
          )}
        </Space>
      </Card>
    </div>
  );
}
