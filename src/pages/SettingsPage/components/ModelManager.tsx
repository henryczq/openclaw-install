import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  App,
  Popconfirm,
  Typography,
  Empty,
  Tooltip,
  Row,
  Col,
  Switch,
  notification,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  StarOutlined,
  StarFilled,
  DatabaseOutlined,
  RobotOutlined,
  CheckOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface ModelInfo {
  providerId: string;
  modelId: string;
  fullName: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  contextWindow: number;
  maxTokens: number;
  reasoning: boolean;
  input: ('text' | 'image')[];
}

interface ProviderInfo {
  providerId: string;
  baseUrl: string;
  apiKey?: string;
  modelCount: number;
  models: string[];
}

export function ModelManager() {
  const { message } = App.useApp();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [defaultModel, setDefaultModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelInfo | null>(null);
  const [form] = Form.useForm();

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (window.electronAPI?.listProviders) {
        const providersResult = await window.electronAPI.listProviders();
        if (providersResult.success) {
          setProviders(providersResult.providers || []);
        }
      }

      if (window.electronAPI?.listModels) {
        const modelsResult = await window.electronAPI.listModels();
        if (modelsResult.success) {
          setModels(modelsResult.models || []);
        }
      }

      if (window.electronAPI?.getDefaultModel) {
        const defaultResult = await window.electronAPI.getDefaultModel();
        if (defaultResult.success) {
          setDefaultModel(defaultResult.model || null);
        }
      }
    } catch (error) {
      message.error('加载模型数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 删除 Provider
  const handleDeleteProvider = async (providerId: string) => {
    try {
      // 检查是否是最后一个 Provider
      if (providers.length <= 1) {
        notification.warning({
          message: '无法删除',
          description: '这是最后一个 Provider，不能删除。请先添加一个新的 Provider 后再删除此 Provider。',
          placement: 'topRight',
          duration: 4,
        });
        return;
      }

      if (window.electronAPI?.deleteProvider) {
        const result = await window.electronAPI.deleteProvider(providerId);
        if (result.success) {
          message.success(`Provider ${providerId} 已删除`);
          loadData();
        } else {
          message.error(result.message || '删除失败');
        }
      }
    } catch (error) {
      message.error('删除 Provider 失败');
      console.error(error);
    }
  };

  // 删除 Model
  const handleDeleteModel = async (providerId: string, modelId: string) => {
    try {
      if (window.electronAPI?.deleteModel) {
        const result = await window.electronAPI.deleteModel(providerId, modelId, false);
        if (result.success) {
          if (result.providerEmpty && !result.providerDeleted) {
            // Provider 已空，提示用户是否删除
            Modal.confirm({
              title: 'Provider 已空',
              content: `模型已删除，Provider ${providerId} 下已无模型，是否删除该 Provider？`,
              onOk: async () => {
                await handleDeleteProvider(providerId);
              },
              onCancel: () => {
                loadData();
              },
            });
          } else {
            message.success(`模型 ${providerId}:${modelId} 已删除`);
            loadData();
          }
        } else {
          // 如果是最后一个模型，使用 notification 提示，位置靠近右侧按钮
          if (result.isLastModel) {
            notification.warning({
              message: '无法删除',
              description: result.message || '这是最后一个模型，不能删除。请先添加一个新模型后再删除此模型。',
              placement: 'topRight',
              duration: 4,
            });
          } else if (result.isDefaultModel) {
            // 如果是默认模型，提示用户先设置其他模型为默认
            notification.warning({
              message: '无法删除默认模型',
              description: result.message || '该模型是当前默认模型，不能删除。请先设置其他模型为默认后再删除。',
              placement: 'topRight',
              duration: 4,
            });
          } else {
            message.error(result.message || '删除失败');
          }
        }
      }
    } catch (error) {
      message.error('删除模型失败');
      console.error(error);
    }
  };

  // 设置默认模型
  const handleSetDefault = async (providerId: string, modelId: string) => {
    try {
      if (window.electronAPI?.setDefaultModel) {
        const result = await window.electronAPI.setDefaultModel(providerId, modelId);
        if (result.success) {
          message.success(`已设置 ${providerId}:${modelId} 为默认模型`);
          setDefaultModel(`${providerId}:${modelId}`);
        } else {
          message.error(result.message || '设置失败');
        }
      }
    } catch (error) {
      message.error('设置默认模型失败');
      console.error(error);
    }
  };

  // 打开编辑对话框
  const handleEdit = (model: ModelInfo) => {
    setEditingModel(model);
    form.setFieldsValue({
      modelName: model.name,
      baseUrl: model.baseUrl,
      apiKey: model.apiKey || '',
      contextWindow: model.contextWindow,
      maxTokens: model.maxTokens,
      reasoning: model.reasoning,
    });
    setEditModalVisible(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      if (!editingModel) return;

      if (window.electronAPI?.updateModel) {
        const result = await window.electronAPI.updateModel({
          providerId: editingModel.providerId,
          modelId: editingModel.modelId,
          modelName: values.modelName,
          baseUrl: values.baseUrl,
          apiKey: values.apiKey || undefined,
          contextWindow: values.contextWindow,
          maxTokens: values.maxTokens,
          reasoning: values.reasoning,
        });

        if (result.success) {
          message.success('模型更新成功');
          setEditModalVisible(false);
          loadData();
        } else {
          message.error(result.message || '更新失败');
        }
      }
    } catch (error) {
      message.error('保存失败');
      console.error(error);
    }
  };

  // Provider 表格列
  const providerColumns = [
    {
      title: 'Provider ID',
      dataIndex: 'providerId',
      key: 'providerId',
      render: (text: string) => (
        <Space>
          <DatabaseOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'API 地址',
      dataIndex: 'baseUrl',
      key: 'baseUrl',
      ellipsis: true,
    },
    {
      title: '模型数量',
      dataIndex: 'modelCount',
      key: 'modelCount',
      render: (count: number) => <Tag color="blue">{count} 个模型</Tag>,
    },
    {
      title: '模型列表',
      dataIndex: 'models',
      key: 'models',
      render: (models: string[]) => (
        <Space size="small" wrap>
          {models.map((m) => (
            <Tag key={m} style={{ fontSize: 12 }}>
              {m}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ProviderInfo) => (
        <Popconfirm
          title="删除 Provider"
          description={`确定要删除 Provider ${record.providerId} 吗？这将同时删除其下的所有模型。`}
          onConfirm={() => handleDeleteProvider(record.providerId)}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // Model 表格列
  const modelColumns = [
    {
      title: '模型',
      key: 'model',
      render: (_: any, record: ModelInfo) => (
        <Space>
          <RobotOutlined />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.fullName}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '默认',
      key: 'default',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: ModelInfo) =>
        defaultModel === record.fullName ? (
          <Tooltip title="默认模型">
            <StarFilled style={{ color: '#faad14', fontSize: 18 }} />
          </Tooltip>
        ) : null,
    },
    {
      title: 'API 地址',
      dataIndex: 'baseUrl',
      key: 'baseUrl',
      ellipsis: true,
    },
    {
      title: '上下文窗口',
      dataIndex: 'contextWindow',
      key: 'contextWindow',
      width: 120,
      render: (value: number) => `${(value / 1000).toFixed(0)}K`,
    },
    {
      title: '最大 Tokens',
      dataIndex: 'maxTokens',
      key: 'maxTokens',
      width: 120,
    },
    {
      title: '推理',
      dataIndex: 'reasoning',
      key: 'reasoning',
      width: 80,
      render: (value: boolean) =>
        value ? <CheckOutlined style={{ color: '#52c41a' }} /> : null,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: ModelInfo) => (
        <Space size="small">
          <Tooltip title="设为默认">
            <Button
              type="link"
              icon={<StarOutlined />}
              onClick={() => handleSetDefault(record.providerId, record.modelId)}
              disabled={defaultModel === record.fullName}
              style={{ padding: '0 4px' }}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ padding: '0 4px' }}
            />
          </Tooltip>
          <Popconfirm
            title="删除模型"
            description={`确定要删除模型 ${record.fullName} 吗？`}
            onConfirm={() => handleDeleteModel(record.providerId, record.modelId)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} style={{ padding: '0 4px' }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <DatabaseOutlined />
                <span>Provider 列表</span>
              </Space>
            }
            size="small"
          >
            {providers.length === 0 ? (
              <Empty description="暂无 Provider 配置" />
            ) : (
              <Table
                dataSource={providers}
                columns={providerColumns}
                rowKey="providerId"
                loading={loading}
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title={
              <Space>
                <RobotOutlined />
                <span>模型列表</span>
                {defaultModel && (
                  <Tag color="gold">
                    默认: {defaultModel}
                  </Tag>
                )}
              </Space>
            }
            size="small"
          >
            {models.length === 0 ? (
              <Empty description="暂无模型配置" />
            ) : (
              <Table
                dataSource={models}
                columns={modelColumns}
                rowKey="fullName"
                loading={loading}
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 编辑模型对话框 */}
      <Modal
        title="编辑模型"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="modelName"
            label="模型名称"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input placeholder="例如：DeepSeek Chat" />
          </Form.Item>

          <Form.Item
            name="baseUrl"
            label="API 地址"
            rules={[{ required: true, message: '请输入 API 地址' }]}
          >
            <Input placeholder="例如：https://api.deepseek.com/v1" />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API Key"
          >
            <Input.Password placeholder="留空表示从环境变量读取" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contextWindow"
                label="上下文窗口"
                rules={[{ required: true }]}
              >
                <InputNumber<number>
                  style={{ width: '100%' }}
                  min={1000}
                  max={200000}
                  step={1000}
                  formatter={(value) => `${(value || 0) / 1000}K`}
                  parser={(value) => {
                    const parsed = parseInt((value || '').replace(/K|k/g, '')) * 1000;
                    return isNaN(parsed) ? 32000 : parsed;
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxTokens"
                label="最大 Tokens"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={100}
                  max={100000}
                  step={100}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reasoning"
            label="支持推理"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
