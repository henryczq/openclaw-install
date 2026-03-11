import { Divider, Form, Input } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { DownloadConfigCard } from '../../settings/components/DownloadConfigCard';
import type { DownloadConfig, DownloadConfigKey, SettingsFormValues } from '../../settings/types';

interface DownloadConfigTabProps {
  configKey: DownloadConfigKey;
  data: DownloadConfig;
  form: ReturnType<typeof Form.useForm<SettingsFormValues>>[0];
  onOpenUrl: (url: string) => void;
}

export function DownloadConfigTab({ configKey, data, form, onOpenUrl }: DownloadConfigTabProps) {
  return (
    <DownloadConfigCard
      configKey={configKey}
      data={data}
      form={form}
      onOpenUrl={onOpenUrl}
      extraContent={configKey === 'openclaw' ? (
        <>
          <Form.Item
            name="openclaw_configPath"
            label="OpenClaw 配置文件路径"
          >
            <Input prefix={<SettingOutlined />} placeholder="请输入配置文件路径" />
          </Form.Item>
          <Divider />
        </>
      ) : null}
    />
  );
}
