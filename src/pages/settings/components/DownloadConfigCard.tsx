import { Button, Card, Descriptions, Divider, Form, Input, Tooltip, Typography, Space, Tag, Alert } from 'antd';
import { DownloadOutlined, GlobalOutlined, LinkOutlined, SettingOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import type { ReactNode } from 'react';
import type { DownloadConfig, DownloadConfigKey, SettingsFormValues } from '../types';

const { Text, Paragraph } = Typography;

interface DownloadConfigCardProps {
  configKey: DownloadConfigKey;
  data: DownloadConfig;
  form: FormInstance<SettingsFormValues>;
  onOpenUrl: (url: string) => void;
  extraContent?: ReactNode;
}

export function DownloadConfigCard({
  configKey,
  data,
  form,
  onOpenUrl,
  extraContent,
}: DownloadConfigCardProps) {
  const hasAutoDownloadUrl = typeof data.autoDownload.url === 'string' && data.autoDownload.url.length > 0;

  return (
    <Card
      title={(
        <Space>
          <SettingOutlined />
          <span>{data.name} 配置</span>
          <Tag color="blue">v{data.version}</Tag>
        </Space>
      )}
      style={{ marginBottom: 16 }}
    >
      {extraContent}

      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="描述">{data.description}</Descriptions.Item>
        <Descriptions.Item label="最低版本要求">{data.minVersion}</Descriptions.Item>
        {data.installCommand && (
          <Descriptions.Item label="安装命令">
            <Text code copyable>{data.installCommand}</Text>
          </Descriptions.Item>
        )}
      </Descriptions>

      <Divider orientation="left">自动下载配置</Divider>
      {hasAutoDownloadUrl ? (
        <>
          <Form.Item
            name={`${configKey}_autoUrl`}
            label="自动下载地址"
            rules={[{ required: true, message: '请输入下载地址' }]}
            initialValue={data.autoDownload.url}
          >
            <Input
              prefix={<DownloadOutlined />}
              suffix={(
                <Tooltip title="在浏览器中打开">
                  <Button
                    type="link"
                    icon={<LinkOutlined />}
                    onClick={() => {
                      const fieldName = `${configKey}_autoUrl` as const;
                      const url = form.getFieldValue(fieldName);
                      if (url) onOpenUrl(url);
                    }}
                  />
                </Tooltip>
              )}
              placeholder="请输入自动下载地址"
            />
          </Form.Item>
          {data.autoDownload.mirror && (
            <Descriptions size="small">
              <Descriptions.Item label="镜像源">{data.autoDownload.mirror}</Descriptions.Item>
              <Descriptions.Item label="文件名">{data.autoDownload.filename}</Descriptions.Item>
            </Descriptions>
          )}
        </>
      ) : (
        <Alert
          message={data.autoDownload.note || '当前组件不提供自动下载地址'}
          type="info"
          showIcon
        />
      )}

      {data.autoDownload.note && hasAutoDownloadUrl && (
        <Alert
          message={data.autoDownload.note}
          type="info"
          showIcon
          style={{ marginTop: 8 }}
        />
      )}

      <Divider orientation="left">手动下载配置</Divider>
      <Form.Item
        name={`${configKey}_manualUrl`}
        label="手动下载地址"
        rules={[{ required: true, message: '请输入手动下载地址' }]}
        initialValue={data.manualDownload.url}
      >
        <Input
          prefix={<GlobalOutlined />}
          suffix={(
            <Tooltip title="在浏览器中打开">
              <Button
                type="link"
                icon={<LinkOutlined />}
                onClick={() => onOpenUrl(form.getFieldValue(`${configKey}_manualUrl`))}
              />
            </Tooltip>
          )}
          placeholder="请输入手动下载地址"
        />
      </Form.Item>
      <Paragraph type="secondary" style={{ fontSize: 12 }}>
        {data.manualDownload.description}
      </Paragraph>
    </Card>
  );
}
