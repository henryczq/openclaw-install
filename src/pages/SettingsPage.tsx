import { useState, type ReactNode } from 'react';
import { Alert, Button, Form, Space, Tabs, Typography } from 'antd';
import { DownloadOutlined, GlobalOutlined, RobotOutlined, SettingOutlined, CloudServerOutlined } from '@ant-design/icons';
import { ModelSettingsTab } from './SettingsPage/tabs/ModelSettingsTab';
import { ServiceManagerTab } from './SettingsPage/tabs/ServiceManagerTab';
import { ViewConfigTab } from './SettingsPage/tabs/ViewConfigTab';
import { DownloadConfigTab } from './SettingsPage/tabs/DownloadConfigTab';
import { useSettingsConfig } from './settings/hooks/useSettingsConfig';
import type { DownloadConfigKey, SettingsFormValues } from './settings/types';

const { Title, Paragraph } = Typography;

const TAB_META: Array<{ key: string; label: ReactNode }> = [
  {
    key: 'models',
    label: (
      <Space>
        <RobotOutlined />
        模型设置
      </Space>
    ),
  },
  {
    key: 'service',
    label: (
      <Space>
        <CloudServerOutlined />
        服务管理
      </Space>
    ),
  },
  {
    key: 'view-config',
    label: (
      <Space>
        <SettingOutlined />
        查看配置
      </Space>
    ),
  },
  {
    key: 'nodejs',
    label: (
      <Space>
        <DownloadOutlined />
        Node.js
      </Space>
    ),
  },
  {
    key: 'git',
    label: (
      <Space>
        <GlobalOutlined />
        Git
      </Space>
    ),
  },
  {
    key: 'openclaw',
    label: (
      <Space>
        <SettingOutlined />
        OpenClaw
      </Space>
    ),
  },
];

export default function SettingsPage() {
  const [form] = Form.useForm<SettingsFormValues>();
  const [activeTab, setActiveTab] = useState('models');
  const {
    config,
    hasChanges,
    configPath,
    configContent,
    backups,
    setConfigContent,
    handleValuesChange,
    handleSave,
    handleReset,
    handleSaveConfigContent,
    handleRestoreBackup,
    loadConfigAndBackups,
    openUrl,
  } = useSettingsConfig(form);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'view-config') {
      void loadConfigAndBackups();
    }
  };

  const renderTabContent = (key: string) => {
    switch (key) {
      case 'models':
        return <ModelSettingsTab />;
      case 'service':
        return <ServiceManagerTab />;
      case 'view-config':
        return (
          <ViewConfigTab
            configPath={configPath}
            configContent={configContent}
            backups={backups}
            hasChanges={hasChanges}
            onConfigContentChange={setConfigContent}
            onSave={handleSaveConfigContent}
            onRefresh={loadConfigAndBackups}
            onRestore={handleRestoreBackup}
            onSaveChanges={handleSave}
            onReset={handleReset}
          />
        );
      case 'nodejs':
      case 'git':
      case 'openclaw':
        return (
          <DownloadConfigTab
            configKey={key as DownloadConfigKey}
            data={config.downloads[key as DownloadConfigKey]}
            form={form}
            onOpenUrl={openUrl}
          />
        );
      default:
        return null;
    }
  };

  const tabItems = TAB_META.map((tab) => ({
    key: tab.key,
    label: tab.label,
    children: renderTabContent(tab.key),
  }));

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <SettingOutlined /> 下载配置设置
      </Title>
      <Paragraph type="secondary">
        管理Node.js、Git和OpenClaw的下载地址和镜像源配置。修改后点击保存即可生效。
      </Paragraph>

      {hasChanges && activeTab !== 'service' && (
        <Alert
          message="配置已修改，请记得保存"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={(
            <Button size="small" type="primary" onClick={handleSave}>
              立即保存
            </Button>
          )}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        <Tabs activeKey={activeTab} onChange={handleTabChange} type="card" items={tabItems} />
      </Form>
    </div>
  );
}
