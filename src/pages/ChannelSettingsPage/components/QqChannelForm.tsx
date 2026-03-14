import { useEffect } from 'react';
import { Form, Input, Switch, Select, Space, Typography, Alert } from 'antd';

const { Text, Paragraph } = Typography;
const { Option } = Select;

interface QqChannelFormProps {
  form: any;
  initialValues?: any;
  isEdit?: boolean;
}

export function QqChannelForm({ form, initialValues, isEdit }: QqChannelFormProps) {
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        channelId: initialValues.channelId,
        enabled: initialValues.enabled ?? true,
        appId: initialValues.appId || '',
        clientSecret: initialValues.raw?.clientSecret || initialValues.appSecret || '',
        token: initialValues.token || '',
        connectionMode: initialValues.raw?.connectionMode || 'websocket',
        dmPolicy: initialValues.dmPolicy || 'pairing',
        groupPolicy: initialValues.groupPolicy || 'open',
        requireMention: initialValues.raw?.requireMention ?? true,
        streaming: initialValues.raw?.streaming ?? true,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        channelId: 'qqbot',
        enabled: true,
        connectionMode: 'websocket',
        dmPolicy: 'pairing',
        groupPolicy: 'open',
        requireMention: true,
        streaming: true,
      });
    }
  }, [form, initialValues]);

  return (
    <Form form={form} layout="vertical">
      <Alert
        message="QQ机器人渠道配置"
        description="配置 QQ 机器人，支持频道和群聊消息处理。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form.Item
        name="channelId"
        label="渠道ID"
        rules={[{ required: true, message: '请输入渠道ID' }]}
      >
        <Input disabled={isEdit} placeholder="qqbot" />
      </Form.Item>

      <Form.Item
        name="enabled"
        label="启用状态"
        valuePropName="checked"
      >
        <Switch checkedChildren="启用" unCheckedChildren="禁用" />
      </Form.Item>

      <Form.Item
        name="appId"
        label="App ID (Bot AppID)"
        rules={[{ required: true, message: '请输入 QQ Bot App ID' }]}
      >
        <Input placeholder="1024xxxxxxxx" />
      </Form.Item>

      <Form.Item
        name="clientSecret"
        label="Client Secret"
        rules={[{ required: true, message: '请输入 Client Secret' }]}
      >
        <Input.Password placeholder="从 QQ 开放平台获取的密钥" />
      </Form.Item>

      <Form.Item
        name="token"
        label="Token"
        rules={[{ required: true, message: '请输入 Token' }]}
      >
        <Input.Password placeholder="机器人 Token" />
      </Form.Item>

      <Form.Item
        name="connectionMode"
        label="连接模式"
        rules={[{ required: true, message: '请选择连接模式' }]}
      >
        <Select>
          <Option value="websocket">WebSocket（推荐）</Option>
          <Option value="webhook">Webhook</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="dmPolicy"
        label="私信策略"
        rules={[{ required: true, message: '请选择私信策略' }]}
      >
        <Select>
          <Option value="open">开放 - 允许所有私信</Option>
          <Option value="pairing">配对 - 需要用户先发送消息</Option>
          <Option value="allowlist">白名单 - 仅允许白名单用户</Option>
          <Option value="closed">关闭 - 禁止私信</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="groupPolicy"
        label="群组策略"
        rules={[{ required: true, message: '请选择群组策略' }]}
      >
        <Select>
          <Option value="open">开放 - 响应所有群组消息</Option>
          <Option value="allowlist">白名单 - 仅响应白名单群组</Option>
          <Option value="blocklist">黑名单 - 不响应黑名单群组</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="requireMention"
        label="需要@提及"
        valuePropName="checked"
      >
        <Switch checkedChildren="是" unCheckedChildren="否" />
      </Form.Item>

      <Form.Item
        name="streaming"
        label="流式响应"
        valuePropName="checked"
      >
        <Switch checkedChildren="启用" unCheckedChildren="禁用" />
      </Form.Item>
    </Form>
  );
}
