import { useCallback, useEffect, useState } from 'react';
import { Card, Typography, Button, Space, Alert, Modal, List, Tag } from 'antd';
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store';
import type { OpenClawResidueItem } from '../types';

const { Title, Text } = Typography;

export default function UninstallPage() {
  const { systemStatus, setSystemStatus, addLog } = useAppStore();
  const [modal, contextHolder] = Modal.useModal();
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [isCheckingResidue, setIsCheckingResidue] = useState(false);
  const [isCleaningResidue, setIsCleaningResidue] = useState(false);
  const [removingResidueKey, setRemovingResidueKey] = useState<string | null>(null);
  const [uninstallResult, setUninstallResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [cleanupResult, setCleanupResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [residueItems, setResidueItems] = useState<OpenClawResidueItem[]>([]);

  const detectResidue = useCallback(async (silent = false) => {
    setIsCheckingResidue(true);

    if (!silent) {
      addLog('开始检测 OpenClaw 安装残余...');
    }

    try {
      const result = await window.electronAPI.detectOpenClawResidue();
      if (!result.success) {
        throw new Error(result.error || '检测失败');
      }

      setResidueItems(result.items);

      if (!silent) {
        if (result.items.length === 0) {
          addLog('未检测到 OpenClaw 安装残余');
        } else {
          addLog(`检测到 ${result.items.length} 项 OpenClaw 安装残余`);
          result.items.forEach((item) => {
            addLog(`[残余] ${item.label}: ${item.path}`);
          });
        }
      }
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      if (!silent) {
        addLog(`检测 OpenClaw 安装残余失败: ${errorText}`);
      }
    } finally {
      setIsCheckingResidue(false);
    }
  }, [addLog]);

  useEffect(() => {
    void detectResidue(true);
  }, [detectResidue]);

  const handleUninstall = useCallback(async () => {
    setIsUninstalling(true);
    setUninstallResult('idle');
    addLog('开始卸载 OpenClaw...');

    try {
      const result = await window.electronAPI.uninstallOpenClaw();
      if (!result.success) {
        throw new Error(result.error || '卸载失败');
      }

      setUninstallResult('success');
      addLog('OpenClaw 卸载成功');

      const checkResult = await window.electronAPI.checkOpenClaw();
      setSystemStatus({ openclaw: checkResult });
      await detectResidue(true);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      setUninstallResult('error');
      addLog(`OpenClaw 卸载失败: ${errorText}`);
    } finally {
      setIsUninstalling(false);
    }
  }, [addLog, detectResidue, setSystemStatus]);

  const showUninstallConfirm = () => {
    modal.confirm({
      title: '确认卸载 OpenClaw？',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>此操作将卸载 OpenClaw，包括：</p>
          <ul>
            <li>OpenClaw 主程序</li>
            <li>相关 npm 全局包</li>
            <li>命令入口和部分配置残留</li>
          </ul>
          <p>Node.js 和 Git 将保留。</p>
        </div>
      ),
      okText: '确认卸载',
      okType: 'danger',
      cancelText: '取消',
      onOk: handleUninstall,
    });
  };

  const handleCleanupResidue = useCallback(async () => {
    setIsCleaningResidue(true);
    setCleanupResult('idle');
    addLog('开始检测并清理 OpenClaw 安装残余...');

    try {
      const result = await window.electronAPI.cleanupOpenClawResidue();
      if (!result.success && !result.failed.length) {
        throw new Error(result.error || '清理失败');
      }

      if (result.removed.length === 0 && result.remaining.length === 0) {
        addLog('未发现需要清理的 OpenClaw 安装残余');
      }

      result.removed.forEach((item) => {
        addLog(`[清理完成] ${item.label}: ${item.path}`);
      });

      result.failed.forEach((item) => {
        addLog(`[清理失败] ${item.label}: ${item.path} - ${item.error}`);
      });

      setResidueItems(result.remaining);
      setCleanupResult(result.failed.length > 0 ? 'error' : 'success');

      const checkResult = await window.electronAPI.checkOpenClaw();
      setSystemStatus({ openclaw: checkResult });
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      setCleanupResult('error');
      addLog(`清理 OpenClaw 安装残余失败: ${errorText}`);
    } finally {
      setIsCleaningResidue(false);
    }
  }, [addLog, setSystemStatus]);

  const showCleanupConfirm = () => {
    modal.confirm({
      title: '确认清理安装残余？',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>此操作会先检测，再清理检测到的 OpenClaw 安装残余，包括：</p>
          <ul>
            <li>npm 全局命令入口</li>
            <li>残留的全局包目录</li>
            <li>本地 wrapper 和用户目录副本</li>
            <li>OpenClaw 用户配置目录</li>
          </ul>
        </div>
      ),
      okText: '确认清理',
      okType: 'danger',
      cancelText: '取消',
      onOk: handleCleanupResidue,
    });
  };

  const handleRemoveResidueItem = useCallback(async (item: OpenClawResidueItem) => {
    setRemovingResidueKey(item.key);
    addLog(`开始手动删除残余: ${item.label} - ${item.path}`);

    try {
      const result = await window.electronAPI.removeOpenClawResidueItem({ key: item.key, path: item.path });
      if (!result.success) {
        throw new Error(result.error || '删除失败');
      }

      addLog(`[手动删除完成] ${item.label}: ${item.path}`);
      setResidueItems(result.remaining || []);

      const checkResult = await window.electronAPI.checkOpenClaw();
      setSystemStatus({ openclaw: checkResult });
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      addLog(`[手动删除失败] ${item.label}: ${item.path} - ${errorText}`);
    } finally {
      setRemovingResidueKey(null);
    }
  }, [addLog, setSystemStatus]);

  const showRemoveResidueConfirm = (item: OpenClawResidueItem) => {
    modal.confirm({
      title: '确认删除这个残余项？',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>{item.label}</p>
          <p>{item.path}</p>
        </div>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => handleRemoveResidueItem(item),
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder}
      <Title level={2}>卸载 OpenClaw</Title>
      <Text type="secondary">
        从系统中移除 OpenClaw，并清理安装失败或卸载后的残余文件
      </Text>

      <Card style={{ marginTop: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
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

          <Card type="inner" title="卸载说明" size="small">
            <List size="small">
              <List.Item>
                <Text>卸载将删除 OpenClaw 主程序和相关 npm 全局包</Text>
              </List.Item>
              <List.Item>
                <Text>清理安装残余会额外删除残留命令、目录和用户配置</Text>
              </List.Item>
              <List.Item>
                <Text>Node.js 和 Git 不会被卸载</Text>
              </List.Item>
              <List.Item>
                <Text>飞书应用需要在飞书开发者后台手动删除</Text>
              </List.Item>
              <List.Item>
                <Text>卸载后可以通过安装页面重新安装</Text>
              </List.Item>
            </List>
          </Card>

          <Space wrap>
            <Button
              type="primary"
              danger
              size="large"
              icon={<DeleteOutlined />}
              onClick={showUninstallConfirm}
              loading={isUninstalling}
              disabled={isUninstalling || isCleaningResidue || !systemStatus.openclaw.installed}
            >
              {isUninstalling ? '卸载中...' : '卸载 OpenClaw'}
            </Button>
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => void detectResidue()}
              loading={isCheckingResidue}
              disabled={isUninstalling || isCleaningResidue}
            >
              {isCheckingResidue ? '检测中...' : '重新检测残余'}
            </Button>
            <Button
              size="large"
              danger
              icon={<DeleteOutlined />}
              onClick={showCleanupConfirm}
              loading={isCleaningResidue}
              disabled={isUninstalling || isCheckingResidue || residueItems.length === 0}
            >
              {isCleaningResidue ? '清理中...' : '清理安装残余'}
            </Button>
          </Space>

          <Card type="inner" title="安装残余检测" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {residueItems.length > 0 ? (
                <Alert
                  message={`检测到 ${residueItems.length} 项安装残余`}
                  description="可点击“清理安装残余”删除这些命令入口、目录或配置残留。"
                  type="warning"
                  showIcon
                />
              ) : (
                <Alert
                  message="未检测到安装残余"
                  description="当前没有发现 OpenClaw 残留命令、目录或配置文件。"
                  type="success"
                  showIcon
                />
              )}

              {residueItems.length > 0 && (
                <List
                  size="small"
                  bordered
                  dataSource={residueItems}
                  renderItem={(item) => (
                    <List.Item>
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                        <Space direction="vertical" size={2} style={{ flex: 1 }}>
                          <Text strong>{item.label}</Text>
                          <Text type="secondary">{item.path}</Text>
                        </Space>
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          loading={removingResidueKey === item.key}
                          disabled={isCleaningResidue || isCheckingResidue || isUninstalling}
                          onClick={() => showRemoveResidueConfirm(item)}
                        >
                          删除
                        </Button>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </Space>
          </Card>

          {uninstallResult === 'success' && (
            <Alert
              message="卸载成功"
              description="OpenClaw 已成功从系统中移除，可根据检测结果继续清理安装残余。"
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          )}
          {uninstallResult === 'error' && (
            <Alert
              message="卸载失败"
              description="卸载过程中出现错误，请查看日志。"
              type="error"
              showIcon
            />
          )}
          {cleanupResult === 'success' && (
            <Alert
              message="安装残余清理完成"
              description="检测到的 OpenClaw 残余已处理完成。"
              type="success"
              showIcon
            />
          )}
          {cleanupResult === 'error' && (
            <Alert
              message="安装残余清理未完全成功"
              description="部分残余未能删除，请查看日志定位具体路径。"
              type="warning"
              showIcon
            />
          )}

          {!systemStatus.openclaw.installed && uninstallResult === 'idle' && (
            <Alert
              message="OpenClaw 未安装"
              description="如果之前安装失败或已卸载，可直接使用“清理安装残余”处理残留文件。"
              type="info"
              showIcon
            />
          )}
        </Space>
      </Card>
    </div>
  );
}
