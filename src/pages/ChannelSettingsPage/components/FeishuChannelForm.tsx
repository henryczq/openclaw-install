import { useEffect, useState } from 'react';
import { Form, Input, Switch, Select, Space, Typography, Alert, Spin, Row, Col } from 'antd';

const { Text } = Typography;
const { Option } = Select;

interface PolicyOption {
  value: string;
  label: string;
  description: string;
}

interface FeishuChannelFormProps {
  form: any;
  initialValues?: any;
  isEdit?: boolean;
}

export function FeishuChannelForm({ form, initialValues, isEdit }: FeishuChannelFormProps) {
  const [loading, setLoading] = useState(false);
  const [dmPolicyOptions, setDmPolicyOptions] = useState<PolicyOption[]>([]);
  const [groupPolicyOptions, setGroupPolicyOptions] = useState<PolicyOption[]>([]);
  const [connectionModeOptions, setConnectionModeOptions] = useState<PolicyOption[]>([]);

  // 加载策略选项
  useEffect(() => {
    const loadPolicyOptions = async () => {
      setLoading(true);
      try {
        const result = await window.electronAPI.getFeishuPolicyOptions();
        if (result.success && result.options) {
          setDmPolicyOptions(result.options.dmPolicy || []);
          setGroupPolicyOptions(result.options.groupPolicy || []);
          setConnectionModeOptions(result.options.connectionMode || []);
        }
      } catch (error) {
        console.error('加载策略选项失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPolicyOptions();
  }, []);

  // 设置表单初始值
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        channelId: initialValues.channelId,
        enabled: initialValues.enabled ?? true,
        appId: initialValues.appId || '',
        appSecret: initialValues.appSecret || '',
        encryptKey: initialValues.raw?.encryptKey || '',
        verificationToken: initialValues.raw?.verificationToken || '',
        connectionMode: initialValues.raw?.connectionMode || 'websocket',
        dmPolicy: initialValues.dmPolicy || 'pairing',
        groupPolicy: initialValues.groupPolicy || 'open',
        requireMention: initialValues.raw?.requireMention ?? true,
        streaming: initialValues.raw?.streaming ?? true,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        channelId: 'feishu',
        enabled: true,
        connectionMode: 'websocket',
        dmPolicy: 'pairing',
        groupPolicy: 'open',
        requireMention: true,
        streaming: true,
      });
    }
  }, [form, initialValues]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin />
        <div style={{ marginTop: 16 }}>加载配置选项...</div>
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical">
      <Alert
        message="飞书渠道配置"
        description="配置飞书机器人，支持 WebSocket 和 Webhook 两种连接模式。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="channelId"
            label="渠道ID"
            rules={[{ required: true, message: '请输入渠道ID' }]}
          >
            <Input disabled={isEdit} placeholder="feishu" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="enabled"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="appId"
            label="App ID"
            rules={[{ required: true, message: '请输入飞书 App ID' }]}
          >
            <Input placeholder="cli_xxxxxxxxxxxxxxxx" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="appSecret"
            label="App Secret"
            rules={[{ required: true, message: '请输入飞书 App Secret' }]}
          >
            <Input.Password placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="encryptKey"
            label="Encrypt Key"
          >
            <Input.Password placeholder="用于 Webhook 消息加密（可选）" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="verificationToken"
            label="Verification Token"
          >
            <Input.Password placeholder="用于 Webhook 验证（可选）" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="connectionMode"
            label="连接模式"
            rules={[{ required: true, message: '请选择连接模式' }]}
          >
            <Select placeholder="请选择连接模式">
              {connectionModeOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  <Space direction="vertical" size={0} style={{ display: 'flex' }}>
                    <Text strong>{option.label}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{option.description}</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="dmPolicy"
            label="私信策略"
            rules={[{ required: true, message: '请选择私信策略' }]}
          >
            <Select placeholder="请选择私信策略">
              {dmPolicyOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  <Space direction="vertical" size={0} style={{ display: 'flex' }}>
                    <Text strong>{option.label}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{option.description}</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="groupPolicy"
            label="群组策略"
            rules={[{ required: true, message: '请选择群组策略' }]}
          >
            <Select placeholder="请选择群组策略">
              {groupPolicyOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  <Space direction="vertical" size={0} style={{ display: 'flex' }}>
                    <Text strong>{option.label}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{option.description}</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="requireMention"
            label="需要@提及"
            valuePropName="checked"
          >
            <Switch checkedChildren="是" unCheckedChildren="否" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="streaming"
            label="流式响应"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
