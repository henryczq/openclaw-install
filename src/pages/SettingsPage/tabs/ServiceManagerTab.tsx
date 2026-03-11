import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Spin,
} from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { showSuccess, showError } from '../../../utils/notification';

const { Text } = Typography;

export function ServiceManagerTab() {
  const [version, setVersion] = useState<string>('');
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [gatewayStatus, setGatewayStatus] = useState<'running' | 'stopped' | 'unknown'>('unknown');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // 获取OpenClaw版本和Gateway状态
  const fetchStatus = useCallback(async () => {
    try {
      // 获取版本
      if (window.electronAPI?.checkOpenClaw) {
        const versionResult = await window.electronAPI.checkOpenClaw();
        if (versionResult.installed && versionResult.version) {
          setVersion(versionResult.version);
          setIsInstalled(true);
        } else {
          setVersion('未安装');
          setIsInstalled(false);
        }
      }

      // 获取Gateway状态
      if (window.electronAPI?.checkPort) {
        const portResult = await window.electronAPI.checkPort(18789);
        // open: true 表示端口被占用（服务运行中），open: false 表示端口可用（服务已停止）
        setGatewayStatus(portResult.open ? 'running' : 'stopped');
      }
    } catch (error) {
      console.error('获取服务状态失败:', error);
      setIsInstalled(false);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // 每5秒刷新一次状态
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // 打开Web界面
  const handleOpenWeb = () => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal('http://localhost:18789/');
    }
  };

  // 执行服务命令
  const executeServiceCommand = async (command: string, successMsg: string) => {
    setLoading(true);
    try {
      if (window.electronAPI?.executeCommand) {
        console.log(`执行命令: openclaw gateway ${command}`);
        const result = await window.electronAPI.executeCommand(`openclaw gateway ${command}`, {
          timeout: 30000,
        });
        console.log('命令执行结果:', result);
        
        if (result.success) {
          showSuccess(successMsg);
          // 延迟刷新状态，停止服务需要更长时间
          const delay = command === 'stop' ? 3000 : 1500;
          setTimeout(() => {
            console.log('第一次刷新状态...');
            fetchStatus();
          }, delay);
          // 再次刷新确保状态更新
          setTimeout(() => {
            console.log('第二次刷新状态...');
            fetchStatus();
          }, delay + 2000);
        } else {
          showError(result.error || '执行失败');
          console.error('命令执行失败:', result.error);
        }
      }
    } catch (error) {
      showError('执行命令失败');
      console.error('执行命令异常:', error);
    } finally {
      setLoading(false);
    }
  };

  // 启动服务
  const handleStart = () => {
    executeServiceCommand('start', '服务启动成功');
  };

  // 停止服务
  const handleStop = () => {
    executeServiceCommand('stop', '服务停止成功');
  };

  // 重启服务
  const handleRestart = () => {
    executeServiceCommand('restart', '服务重启成功');
  };

  const getStatusTag = () => {
    switch (gatewayStatus) {
      case 'running':
        return <Tag icon={<CheckCircleOutlined />} color="success">运行中</Tag>;
      case 'stopped':
        return <Tag icon={<CloseCircleOutlined />} color="error">已停止</Tag>;
      default:
        return <Tag icon={<InfoCircleOutlined />} color="default">未知</Tag>;
    }
  };

  // 初始加载状态
  if (initialLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin size="large" tip="正在检测服务状态..." />
      </div>
    );
  }

  return (
    <div>
      {!isInstalled && (
        <Alert
          message="OpenClaw 未安装"
          description="请先安装 OpenClaw 后再使用服务管理功能"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="OpenClaw 版本" variant="borderless">
            <Statistic
              value={version || '检测中...'}
              valueStyle={{ fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Gateway 运行状态" variant="borderless">
            <Space direction="vertical" style={{ width: '100%' }}>
              {getStatusTag()}
              <Text type="secondary">
                端口: 18789
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="服务操作" style={{ marginTop: 16 }} variant="borderless">
        <Space size="middle" wrap>
          <Button
            type="primary"
            icon={<GlobalOutlined />}
            onClick={handleOpenWeb}
            disabled={!isInstalled || gatewayStatus !== 'running'}
          >
            打开 Web 界面
          </Button>
          <Button
            icon={<PlayCircleOutlined />}
            onClick={handleStart}
            loading={loading}
            disabled={!isInstalled || gatewayStatus === 'running'}
          >
            启动服务
          </Button>
          <Button
            icon={<StopOutlined />}
            onClick={handleStop}
            loading={loading}
            disabled={!isInstalled || gatewayStatus !== 'running'}
            danger
          >
            停止服务
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRestart}
            loading={loading}
            disabled={!isInstalled || gatewayStatus !== 'running'}
          >
            重启服务
          </Button>
        </Space>
      </Card>
    </div>
  );
}
