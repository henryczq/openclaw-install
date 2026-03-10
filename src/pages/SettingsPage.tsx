import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Tabs,
  Descriptions,
  Tag,
  Alert,
  Tooltip,
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  LinkOutlined,
  DownloadOutlined,
  GlobalOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import downloadConfig from '../config/downloads.json';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface DownloadConfig {
  name: string;
  description: string;
  version: string;
  autoDownload: {
    url: string | null;
    mirror: string | null;
    filename: string | null;
    note?: string;
  };
  manualDownload: {
    url: string;
    description: string;
  };
  installCommand?: string;
  minVersion: string;
}

interface ConfigData {
  downloads: {
    nodejs: DownloadConfig;
    git: DownloadConfig;
    openclaw: DownloadConfig;
  };
  mirrors: {
    nodejs: {
      primary: string;
      backup: string;
    };
    git: {
      primary: string;
      backup: string;
    };
  };
}

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [config, setConfig] = useState<ConfigData>(downloadConfig as ConfigData);
  const [activeTab, setActiveTab] = useState('nodejs');
  const [hasChanges, setHasChanges] = useState(false);
  const [configPath, setConfigPath] = useState('');

  // 加载保存的配置
  useEffect(() => {
    // 加载下载配置
    const savedConfig = localStorage.getItem('openclaw-download-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        form.setFieldsValue({
          nodejs_autoUrl: parsed.downloads.nodejs.autoDownload.url,
          nodejs_manualUrl: parsed.downloads.nodejs.manualDownload.url,
          git_autoUrl: parsed.downloads.git.autoDownload.url,
          git_manualUrl: parsed.downloads.git.manualDownload.url,
          openclaw_manualUrl: parsed.downloads.openclaw.manualDownload.url,
        });
      } catch (e) {
        console.error('加载配置失败:', e);
      }
    }
    
    // 加载 OpenClaw 配置文件路径
    if (window.electronAPI && window.electronAPI.getConfigPath) {
      window.electronAPI.getConfigPath().then(result => {
        if (result && result.path) {
          setConfigPath(result.path || '');
          form.setFieldsValue({
            openclaw_configPath: result.path
          });
        }
      });
    }
  }, [form]);

  const handleValuesChange = () => {
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // 保存 OpenClaw 配置文件路径
      if (values.openclaw_configPath && values.openclaw_configPath !== configPath) {
        if (window.electronAPI && window.electronAPI.setConfigPath) {
          const result = await window.electronAPI.setConfigPath(values.openclaw_configPath);
          if (result.success && result.path) {
            setConfigPath(result.path);
            message.success('OpenClaw 配置文件路径已更新');
          } else {
            message.error(`路径更新失败: ${result.error}`);
          }
        }
      }

      const newConfig = {
        ...config,
        downloads: {
          nodejs: {
            ...config.downloads.nodejs,
            autoDownload: {
              ...config.downloads.nodejs.autoDownload,
              url: values.nodejs_autoUrl,
            },
            manualDownload: {
              ...config.downloads.nodejs.manualDownload,
              url: values.nodejs_manualUrl,
            },
          },
          git: {
            ...config.downloads.git,
            autoDownload: {
              ...config.downloads.git.autoDownload,
              url: values.git_autoUrl,
            },
            manualDownload: {
              ...config.downloads.git.manualDownload,
              url: values.git_manualUrl,
            },
          },
          openclaw: {
            ...config.downloads.openclaw,
            manualDownload: {
              ...config.downloads.openclaw.manualDownload,
              url: values.openclaw_manualUrl,
            },
          },
        },
      };

      localStorage.setItem('openclaw-download-config', JSON.stringify(newConfig));
      setConfig(newConfig);
      setHasChanges(false);
      message.success('配置已保存');
    } catch (error) {
      message.error('保存失败，请检查输入');
    }
  };

  const handleReset = () => {
    form.setFieldsValue({
      nodejs_autoUrl: downloadConfig.downloads.nodejs.autoDownload.url,
      nodejs_manualUrl: downloadConfig.downloads.nodejs.manualDownload.url,
      git_autoUrl: downloadConfig.downloads.git.autoDownload.url,
      git_manualUrl: downloadConfig.downloads.git.manualDownload.url,
      openclaw_manualUrl: downloadConfig.downloads.openclaw.manualDownload.url,
      // 注意：这里不重置 configPath，因为它是全局设置
    });
    setConfig(downloadConfig as ConfigData);
    localStorage.removeItem('openclaw-download-config');
    setHasChanges(false);
    message.success('已恢复默认配置');
  };

  const openUrl = (url: string) => {
    if (window.electronAPI) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const [configContent, setConfigContent] = useState('');
  const [backups, setBackups] = useState<Array<{ name: string; path: string; time: string }>>([]);
  const [, setLoadingConfig] = useState(false);

  // 加载 OpenClaw 配置文件内容和备份列表
  const loadConfigAndBackups = async () => {
    if (!window.electronAPI) return;
    
    // 检查API是否可用（防止未重启应用导致preload未更新）
    if (!window.electronAPI.readOpenClawConfig || !window.electronAPI.listBackups) {
      message.error('检测到应用未完全重启，请关闭并重新打开应用以加载新功能');
      setConfigContent('// 请重启应用以加载配置查看功能');
      return;
    }

    setLoadingConfig(true);
    try {
      // 读取配置内容
      const configResult = await window.electronAPI.readOpenClawConfig();
      if (configResult.success && configResult.config) {
        setConfigContent(JSON.stringify(configResult.config, null, 2));
      } else {
        setConfigContent('// 配置文件不存在或为空');
      }
      
      // 读取备份列表
      const backupsResult = await window.electronAPI.listBackups();
      if (backupsResult.success && backupsResult.backups) {
        setBackups(backupsResult.backups.map((b: any) => ({
          ...b,
          time: new Date(b.time).toLocaleString()
        })));
      }
    } catch (e) {
      console.error('Failed to load config:', e);
      message.error('加载配置文件失败');
    } finally {
      setLoadingConfig(false);
    }
  };

  // 监听Tab切换，切换到查看配置时加载数据
  useEffect(() => {
    if (activeTab === 'view-config') {
      loadConfigAndBackups();
    }
  }, [activeTab]);

  const handleSaveConfigContent = async () => {
    try {
      // 验证 JSON 格式
      JSON.parse(configContent);
      
      if (window.electronAPI && window.electronAPI.saveRawConfig) {
        const result = await window.electronAPI.saveRawConfig(configContent);
        if (result.success) {
          message.success('配置已保存并备份');
          loadConfigAndBackups(); // 刷新备份列表
        } else {
          message.error(`保存失败: ${result.error}`);
        }
      }
    } catch (e) {
      message.error('JSON 格式错误，请检查后再保存');
    }
  };

  const handleRestoreBackup = async (backupPath: string) => {
    if (window.electronAPI && window.electronAPI.restoreBackup) {
      const result = await window.electronAPI.restoreBackup(backupPath);
      if (result.success) {
        message.success('配置已恢复');
        loadConfigAndBackups(); // 刷新当前配置内容
      } else {
        message.error(`恢复失败: ${result.error}`);
      }
    }
  };

  const renderConfigCard = (key: string, data: DownloadConfig) => (
    <Card
      title={
        <Space>
          <SettingOutlined />
          <span>{data.name} 配置</span>
          <Tag color="blue">v{data.version}</Tag>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      {key === 'openclaw' && (
        <>
          <Form.Item
            name="openclaw_configPath"
            label="OpenClaw 配置文件路径"
          >
            <Input prefix={<SettingOutlined />} placeholder="请输入配置文件路径" />
          </Form.Item>
          <Divider />
        </>
      )}
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
      <Form.Item
        name={`${key}_autoUrl`}
        label="自动下载地址"
        rules={[{ required: true, message: '请输入下载地址' }]}
        initialValue={data.autoDownload.url}
      >
        <Input
          prefix={<DownloadOutlined />}
          suffix={
            <Tooltip title="在浏览器中打开">
              <Button
                type="link"
                icon={<LinkOutlined />}
                onClick={() => openUrl(form.getFieldValue(`${key}_autoUrl`))}
              />
            </Tooltip>
          }
          placeholder="请输入自动下载地址"
        />
      </Form.Item>
      {data.autoDownload.mirror && (
        <Descriptions size="small">
          <Descriptions.Item label="镜像源">{data.autoDownload.mirror}</Descriptions.Item>
          <Descriptions.Item label="文件名">{data.autoDownload.filename}</Descriptions.Item>
        </Descriptions>
      )}
      {data.autoDownload.note && (
        <Alert
          message={data.autoDownload.note}
          type="info"
          showIcon
          style={{ marginTop: 8 }}
        />
      )}

      <Divider orientation="left">手动下载配置</Divider>
      <Form.Item
        name={`${key}_manualUrl`}
        label="手动下载地址"
        rules={[{ required: true, message: '请输入手动下载地址' }]}
        initialValue={data.manualDownload.url}
      >
        <Input
          prefix={<GlobalOutlined />}
          suffix={
            <Tooltip title="在浏览器中打开">
              <Button
                type="link"
                icon={<LinkOutlined />}
                onClick={() => openUrl(form.getFieldValue(`${key}_manualUrl`))}
              />
            </Tooltip>
          }
          placeholder="请输入手动下载地址"
        />
      </Form.Item>
      <Paragraph type="secondary" style={{ fontSize: 12 }}>
        {data.manualDownload.description}
      </Paragraph>
    </Card>
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <SettingOutlined /> 下载配置设置
      </Title>
      <Paragraph type="secondary">
        管理Node.js、Git和OpenClaw的下载地址和镜像源配置。修改后点击保存即可生效。
      </Paragraph>

      {hasChanges && (
        <Alert
          message="配置已修改，请记得保存"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" type="primary" onClick={handleSave}>
              立即保存
            </Button>
          }
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
          <TabPane
            tab={
              <Space>
                <DownloadOutlined />
                Node.js
              </Space>
            }
            key="nodejs"
          >
            {renderConfigCard('nodejs', config.downloads.nodejs)}
          </TabPane>

          <TabPane
            tab={
              <Space>
                <GlobalOutlined />
                Git
              </Space>
            }
            key="git"
          >
            {renderConfigCard('git', config.downloads.git)}
          </TabPane>

          <TabPane
            tab={
              <Space>
                <SettingOutlined />
                OpenClaw
              </Space>
            }
            key="openclaw"
          >
            {renderConfigCard('openclaw', config.downloads.openclaw)}
          </TabPane>

          <TabPane
            tab={
              <Space>
                <SettingOutlined />
                查看配置
              </Space>
            }
            key="view-config"
          >
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ flex: 2 }}>
                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>当前配置文件内容 ({configPath})</Text>
                  <Space>
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<SaveOutlined />} 
                      onClick={handleSaveConfigContent}
                    >
                      保存并备份
                    </Button>
                    <Button 
                      size="small" 
                      icon={<ReloadOutlined />} 
                      onClick={loadConfigAndBackups}
                    >
                      刷新
                    </Button>
                  </Space>
                </div>
                <Input.TextArea
                  value={configContent}
                  onChange={(e) => setConfigContent(e.target.value)}
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
                      {backups.map((backup: any) => (
                        <Card 
                          key={backup.name} 
                          size="small" 
                          title={backup.time}
                          extra={
                            <Button 
                              type="link" 
                              size="small" 
                              onClick={() => {
                                if (window.confirm(`确定要恢复到 ${backup.time} 的版本吗？当前配置将被覆盖。`)) {
                                  handleRestoreBackup(backup.path);
                                }
                              }}
                            >
                              恢复
                            </Button>
                          }
                        >
                          <Text type="secondary" style={{ fontSize: 12 }}>{backup.name}</Text>
                        </Card>
                      ))}
                    </Space>
                  )}
                </div>
              </div>
            </div>
          </TabPane>
        </Tabs>

        <Divider />

        <Space size="middle">
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            保存配置
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
          >
            恢复默认
          </Button>
        </Space>
      </Form>

      <Card title="镜像源信息" style={{ marginTop: 24 }}>
        <Descriptions bordered size="small">
          <Descriptions.Item label="Node.js 主镜像">
            <Text copyable>{config.mirrors.nodejs.primary}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Node.js 备用镜像">
            <Text copyable>{config.mirrors.nodejs.backup}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Git 主镜像">
            <Text copyable>{config.mirrors.git.primary}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Git 备用镜像">
            <Text copyable>{config.mirrors.git.backup}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
