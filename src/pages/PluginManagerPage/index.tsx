import { useEffect, useState, useCallback } from 'react';
import { Card, List, Button, Empty, Spin, message, Modal, Typography, Tag, Space, Tooltip } from 'antd';
import { DeleteOutlined, ReloadOutlined, FolderOpenOutlined, AppstoreOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface PluginInfo {
  name: string;
  path: string;
  version?: string;
  description?: string;
}

export default function PluginManagerPage() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadPlugins = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.listPlugins();
      if (result.success) {
        setPlugins(result.plugins || []);
      } else {
        message.error(result.error || '加载插件列表失败');
      }
    } catch (error) {
      message.error('加载插件列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlugins();
  }, [loadPlugins]);

  const handleDelete = async (plugin: PluginInfo) => {
    Modal.confirm({
      title: '确认删除',
      content: (
        <div>
          <p>确定要删除插件 <strong>{plugin.name}</strong> 吗？</p>
          <Text type="secondary" style={{ fontSize: 12 }}>
            插件路径: {plugin.path}
          </Text>
        </div>
      ),
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setDeleting(plugin.name);
        try {
          const result = await window.electronAPI.deletePlugin(plugin.path);
          if (result.success) {
            message.success(`插件 ${plugin.name} 已删除`);
            loadPlugins();
          } else {
            message.error(result.error || '删除失败');
          }
        } catch (error) {
          message.error('删除插件失败');
          console.error(error);
        } finally {
          setDeleting(null);
        }
      },
    });
  };

  const handleOpenFolder = async () => {
    try {
      await window.electronAPI.openPluginFolder();
    } catch (error) {
      message.error('打开插件目录失败');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <AppstoreOutlined />
            <span>插件管理</span>
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="打开插件目录">
              <Button
                icon={<FolderOpenOutlined />}
                onClick={handleOpenFolder}
              >
                打开目录
              </Button>
            </Tooltip>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadPlugins}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          插件目录: C:\Users\Administrator\.openclaw\extensions\
        </Text>

        <Spin spinning={loading}>
          {plugins.length === 0 ? (
            <Empty
              description="暂无插件"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
              dataSource={plugins}
              renderItem={(plugin) => (
                <List.Item>
                  <Card
                    size="small"
                    title={
                      <Space>
                        <span>{plugin.name}</span>
                        {plugin.version && (
                          <Tag color="blue" style={{ fontSize: 11 }}>
                            v{plugin.version}
                          </Tag>
                        )}
                      </Space>
                    }
                    actions={[
                      <Button
                        key="delete"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        loading={deleting === plugin.name}
                        onClick={() => handleDelete(plugin)}
                      >
                        删除
                      </Button>,
                    ]}
                  >
                    <div style={{ minHeight: 60 }}>
                      {plugin.description ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {plugin.description}
                        </Text>
                      ) : (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          暂无描述
                        </Text>
                      )}
                      <br />
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          display: 'block',
                          marginTop: 8,
                          wordBreak: 'break-all',
                        }}
                        ellipsis={{ rows: 2 }}
                      >
                        {plugin.path}
                      </Text>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
}
