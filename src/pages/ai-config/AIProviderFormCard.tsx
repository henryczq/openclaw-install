import { Alert, Button, Card, Input, Select, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import type { ProviderModelOption } from './types';

const { Text } = Typography;
const { Option } = Select;

interface AIProviderFormCardProps {
  description?: string;
  endpointLabel?: string;
  endpoint?: string;
  endpointEditable?: boolean;
  endpointPlaceholder?: string;
  onEndpointChange?: (value: string) => void;
  providerLabel?: string;
  providerValue?: string;
  providerEditable?: boolean;
  providerPlaceholder?: string;
  onProviderChange?: (value: string) => void;
  modelLabel?: string;
  modelValue: string;
  modelOptions?: ProviderModelOption[];
  modelEditable?: boolean;
  modelPlaceholder?: string;
  onModelChange: (value: string) => void;
  apiKeyValue: string;
  apiKeyPlaceholder: string;
  apiKeyVisible: boolean;
  onApiKeyChange: (value: string) => void;
  onApiKeyVisibleChange: (visible: boolean) => void;
  apiKeyActions?: ReactNode;
  statusAlerts?: ReactNode;
  onSave: () => void;
  onTest: () => void;
  isSaving: boolean;
  isTesting: boolean;
  saveDisabled: boolean;
  testDisabled: boolean;
}

export function AIProviderFormCard({
  description,
  endpointLabel = 'API 端点',
  endpoint,
  endpointEditable = false,
  endpointPlaceholder,
  onEndpointChange,
  providerLabel = 'Provider',
  providerValue,
  providerEditable = false,
  providerPlaceholder,
  onProviderChange,
  modelLabel = '选择 AI 模型',
  modelValue,
  modelOptions,
  modelEditable = false,
  modelPlaceholder,
  onModelChange,
  apiKeyValue,
  apiKeyPlaceholder,
  apiKeyVisible,
  onApiKeyChange,
  onApiKeyVisibleChange,
  apiKeyActions,
  statusAlerts,
  onSave,
  onTest,
  isSaving,
  isTesting,
  saveDisabled,
  testDisabled,
}: AIProviderFormCardProps) {
  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {description && (
          <Alert
            message="配置说明"
            description={description}
            type="info"
            showIcon
          />
        )}

        <div>
          <Text strong>{endpointLabel}：</Text>
          {endpointEditable ? (
            <Input
              value={endpoint}
              onChange={(event) => onEndpointChange?.(event.target.value)}
              placeholder={endpointPlaceholder}
              size="large"
              style={{ marginTop: 8 }}
            />
          ) : (
            <Tag color="blue">
              <code>{endpoint}</code>
            </Tag>
          )}
        </div>

        {providerEditable && providerValue !== undefined && onProviderChange && (
          <div>
            <Text strong>{providerLabel}：</Text>
            <Input
              value={providerValue}
              onChange={(event) => onProviderChange(event.target.value)}
              placeholder={providerPlaceholder}
              size="large"
              style={{ marginTop: 8 }}
              maxLength={50}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              请输入英文名称（仅支持字母、数字、下划线、连字符）
            </Text>
          </div>
        )}

        <div>
          <Text strong>{modelLabel}：</Text>
          {modelEditable ? (
            <Input
              value={modelValue}
              onChange={(event) => onModelChange(event.target.value)}
              placeholder={modelPlaceholder}
              size="large"
              style={{ marginTop: 8 }}
            />
          ) : (
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={modelValue}
              onChange={onModelChange}
              size="large"
            >
              {modelOptions?.map((model) => (
                <Option key={model.value} value={model.value}>
                  <Space>
                    <span>{model.label}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>{model.desc}</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          )}
        </div>

        <div>
          <Space style={{ marginBottom: 8 }}>
            <Text strong>API Key：</Text>
            {apiKeyActions}
          </Space>
          <Input.Password
            value={apiKeyValue}
            onChange={(event) => onApiKeyChange(event.target.value)}
            placeholder={apiKeyPlaceholder}
            size="large"
            visibilityToggle={{ visible: apiKeyVisible, onVisibleChange: onApiKeyVisibleChange }}
          />
        </div>

        {statusAlerts}

        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={onSave}
            loading={isSaving}
            disabled={saveDisabled}
          >
            保存配置
          </Button>
          <Button
            icon={isTesting ? <LoadingOutlined /> : <CheckCircleOutlined />}
            onClick={onTest}
            loading={isTesting}
            disabled={testDisabled}
          >
            {isTesting ? '测试中...' : '测试连接'}
          </Button>
        </Space>
      </Space>
    </Card>
  );
}
