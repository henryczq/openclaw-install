import { Divider, Button, Space } from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { OpenClawConfigViewer } from '../../settings/components/OpenClawConfigViewer';
import type { ConfigBackup } from '../../settings/types';

interface ViewConfigTabProps {
  configPath: string;
  configContent: string;
  backups: ConfigBackup[];
  hasChanges: boolean;
  onConfigContentChange: (content: string) => void;
  onSave: () => void;
  onRefresh: () => void;
  onRestore: (backupPath: string) => void;
  onSaveChanges: () => void;
  onReset: () => void;
}

export function ViewConfigTab({
  configPath,
  configContent,
  backups,
  hasChanges,
  onConfigContentChange,
  onSave,
  onRefresh,
  onRestore,
  onSaveChanges,
  onReset,
}: ViewConfigTabProps) {
  return (
    <>
      <OpenClawConfigViewer
        configPath={configPath}
        configContent={configContent}
        backups={backups}
        onConfigContentChange={onConfigContentChange}
        onSave={onSave}
        onRefresh={onRefresh}
        onRestore={onRestore}
      />
      <Divider />
      <Space size="middle">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={onSaveChanges}
          disabled={!hasChanges}
        >
          保存配置
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={onReset}
        >
          恢复默认
        </Button>
      </Space>
    </>
  );
}
