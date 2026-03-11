import { Button, Card, Input, Space, Typography } from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import type { ConfigBackup } from '../types';

const { Text, Title } = Typography;

interface OpenClawConfigViewerProps {
  configPath: string;
  configContent: string;
  backups: ConfigBackup[];
  onConfigContentChange: (content: string) => void;
  onSave: () => void;
  onRefresh: () => void;
  onRestore: (backupPath: string) => void;
}

export function OpenClawConfigViewer({
  configPath,
  configContent,
  backups,
  onConfigContentChange,
  onSave,
  onRefresh,
  onRestore,
}: OpenClawConfigViewerProps) {
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ flex: 2 }}>
        <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
          <Text strong>当前配置文件内容 ({configPath})</Text>
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              onClick={onSave}
            >
              保存并备份
            </Button>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={onRefresh}
            >
              刷新
            </Button>
          </Space>
        </div>
        <Input.TextArea
          value={configContent}
          onChange={(event) => onConfigContentChange(event.target.value)}
          rows={20}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </div>

      <div style={{ flex: 1 }}>
        <Title level={5}>备份历史</Title>
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {backups.length === 0 ? (
            <Text type="secondary">暂无备份</Text>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              {backups.map((backup) => (
                <Card
                  key={backup.name}
                  size="small"
                  title={backup.time}
                  extra={(
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        if (window.confirm(`确定要恢复到 ${backup.time} 的版本吗？当前配置将被覆盖。`)) {
                          onRestore(backup.path);
                        }
                      }}
                    >
                      恢复
                    </Button>
                  )}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>{backup.name}</Text>
                </Card>
              ))}
            </Space>
          )}
        </div>
      </div>
    </div>
  );
}
