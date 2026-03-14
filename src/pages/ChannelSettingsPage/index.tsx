import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Table, Space, Tag, Modal, Form, Input, Switch, Popconfirm, message, Alert, Typography, Select, Dropdown } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined, ApiOutlined, DownOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { FeishuChannelForm } from './components/FeishuChannelForm';
import { QqChannelForm } from './components/QqChannelForm';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

interface Channel {
  channelId: string;
  name: string;
  enabled: boolean;
  appId?: string;
  appSecret?: string;
  token?: string;
  dmPolicy?: string;
  groupPolicy?: string;
  accounts?: Record<string, any>;
  raw?: any;
}

type ChannelType = 'feishu' | 'qqbot' | 'other';

export default function ChannelSettingsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [channelType, setChannelType] = useState<ChannelType>('feishu');
  const [form] = Form.useForm();

  // 加载渠道列表
  const loadChannels = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.listChannels();
      if (result.success) {
        setChannels(result.channels || []);
      } else {
        message.error(result.message || '加载渠道列表失败');
      }
    } catch (error) {
      message.error('加载渠道列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  // 打开编辑弹窗
  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel);
    const type = channel.channelId === 'feishu' ? 'feishu' : 
                 channel.channelId === 'qqbot' ? 'qqbot' : 'other';
    setChannelType(type);
    setModalVisible(true);
  };

  // 打开新增弹窗
  const handleAdd = (type: ChannelType) => {
    setEditingChannel(null);
    setChannelType(type);
    form.resetFields();
    setModalVisible(true);
  };

  // 保存渠道
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 根据渠道类型构建保存参数
      const saveParams: any = {
        channelId: values.channelId,
        enabled: values.enabled,
        appId: values.appId || undefined,
        dmPolicy: values.dmPolicy,
        groupPolicy: values.groupPolicy,
      };

      // 飞书渠道
      if (channelType === 'feishu') {
        saveParams.appSecret = values.appSecret || undefined;
        saveParams.encryptKey = values.encryptKey || undefined;
        saveParams.verificationToken = values.verificationToken || undefined;
        saveParams.connectionMode = values.connectionMode;
        saveParams.requireMention = values.requireMention;
        saveParams.streaming = values.streaming;
      }
      // QQ渠道
      else if (channelType === 'qqbot') {
        saveParams.clientSecret = values.clientSecret || undefined;
        saveParams.token = values.token || undefined;
        saveParams.connectionMode = values.connectionMode;
        saveParams.requireMention = values.requireMention;
        saveParams.streaming = values.streaming;
      }
      // 其他渠道
      else {
        saveParams.appSecret = values.appSecret || undefined;
        saveParams.token = values.token || undefined;
      }

      const result = await window.electronAPI.saveChannel(saveParams);

      if (result.success) {
        message.success(editingChannel ? '渠道更新成功' : '渠道添加成功');
        setModalVisible(false);
        loadChannels();
      } else {
        message.error(result.message || '保存失败');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 删除渠道
  const handleDelete = async (channelId: string) => {
    try {
      setLoading(true);
      const result = await window.electronAPI.deleteChannel(channelId);
      if (result.success) {
        message.success('渠道删除成功');
        loadChannels();
      } else {
        message.error(result.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 获取策略标签
  const getPolicyTag = (policy?: string) => {
    const policyMap: Record<string, { color: string; text: string }> = {
      open: { color: 'green', text: '开放' },
      pairing: { color: 'blue', text: '配对' },
      closed: { color: 'red', text: '关闭' },
      allowlist: { color: 'orange', text: '白名单' },
      blocklist: { color: 'purple', text: '黑名单' },
    };
    const config = policyMap[policy || ''] || { color: 'default', text: policy || '-' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取渠道类型标签
  const getChannelTypeTag = (channelId: string) => {
    if (channelId === 'feishu') return <Tag color="blue">飞书</Tag>;
    if (channelId === 'qqbot') return <Tag color="cyan">QQ</Tag>;
    return <Tag>其他</Tag>;
  };

  const columns: ColumnsType<Channel> = [
    {
      title: '渠道ID',
      dataIndex: 'channelId',
      key: 'channelId',
      width: 150,
    },
    {
      title: '类型',
      key: 'type',
      width: 100,
      render: (_, record) => getChannelTypeTag(record.channelId),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: 'App ID',
      dataIndex: 'appId',
      key: 'appId',
      ellipsis: true,
      render: (appId?: string) => appId || '-',
    },
    {
      title: '私信策略',
      dataIndex: 'dmPolicy',
      key: 'dmPolicy',
      width: 100,
      render: (policy?: string) => getPolicyTag(policy),
    },
    {
      title: '群组策略',
      dataIndex: 'groupPolicy',
      key: 'groupPolicy',
      width: 100,
      render: (policy?: string) => getPolicyTag(policy),
    },
    {
      title: '账号数',
      key: 'accounts',
      width: 100,
      render: (_, record) => {
        const count = record.accounts ? Object.keys(record.accounts).length : 0;
        return <Tag>{count} 个</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除渠道 "${record.channelId}" 吗？`}
            onConfirm={() => handleDelete(record.channelId)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 添加按钮下拉菜单
  const addMenuItems = [
    {
      key: 'feishu',
      label: '添加飞书渠道',
      onClick: () => handleAdd('feishu'),
    },
    {
      key: 'qqbot',
      label: '添加 QQ 渠道',
      onClick: () => handleAdd('qqbot'),
    },
    {
      key: 'other',
      label: '添加其他渠道',
      onClick: () => handleAdd('other'),
    },
  ];

  // 渲染表单内容
  const renderForm = () => {
    if (editingChannel) {
      // 编辑模式，根据渠道类型显示对应表单
      if (channelType === 'feishu') {
        return <FeishuChannelForm form={form} initialValues={editingChannel} isEdit />;
      } else if (channelType === 'qqbot') {
        return <QqChannelForm form={form} initialValues={editingChannel} isEdit />;
    }
    }
    // 新增模式，根据选择的类型显示对应表单
    if (channelType === 'feishu') {
      return <FeishuChannelForm form={form} />;
    } else if (channelType === 'qqbot') {
      return <QqChannelForm form={form} />;
    }
    // 其他渠道使用通用表单
    return (
      <Form form={form} layout="vertical">
        <Alert
          message="通用渠道配置"
          description="配置其他类型的渠道，请根据实际情况填写参数。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form.Item
          name="channelId"
          label="渠道ID"
          rules={[{ required: true, message: '请输入渠道ID' }]}
        >
          <Input placeholder="自定义渠道ID" />
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
          label="App ID"
        >
          <Input placeholder="应用ID（可选）" />
        </Form.Item>
        <Form.Item
          name="appSecret"
          label="App Secret"
        >
          <Input.Password placeholder="应用密钥（可选）" />
        </Form.Item>
        <Form.Item
          name="token"
          label="Token"
        >
          <Input.Password placeholder="Token（可选）" />
        </Form.Item>
        <Form.Item
          name="dmPolicy"
          label="私信策略"
        >
          <Select>
            <Option value="open">开放</Option>
            <Option value="pairing">配对</Option>
            <Option value="allowlist">白名单</Option>
            <Option value="closed">关闭</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="groupPolicy"
          label="群组策略"
        >
          <Select>
            <Option value="open">开放</Option>
            <Option value="allowlist">白名单</Option>
            <Option value="blocklist">黑名单</Option>
          </Select>
        </Form.Item>
      </Form>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <ApiOutlined /> 渠道设置
      </Title>
      <Paragraph type="secondary">
        管理 OpenClaw 的渠道配置，支持飞书、QQ机器人等。可以查看、编辑和删除渠道信息。
      </Paragraph>

      <Alert
        message="渠道配置说明"
        description={
          <div>
            <Paragraph style={{ marginBottom: 4 }}>
              • <Text strong>私信策略</Text>：控制私聊消息的响应方式（开放/配对/白名单/关闭）
            </Paragraph>
            <Paragraph style={{ marginBottom: 4 }}>
              • <Text strong>群组策略</Text>：控制群组消息的响应方式（开放/白名单/黑名单）
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              • <Text strong>账号配置</Text>：支持多账号管理，每个渠道可以配置多个机器人账号
            </Paragraph>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card
        title="渠道列表"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadChannels}
              loading={loading}
            >
              刷新
            </Button>
            <Dropdown menu={{ items: addMenuItems }} placement="bottomRight">
              <Button type="primary" icon={<PlusOutlined />}>
                添加渠道 <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={channels}
          rowKey="channelId"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title={editingChannel ? `编辑渠道 - ${editingChannel.channelId}` : '添加渠道'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <div style={{ marginTop: 16 }}>
          {renderForm()}
        </div>
      </Modal>
    </div>
  );
}
