import { Layout as AntLayout, Menu, Typography, Space, Tag } from 'antd';
import {
  DownloadOutlined,
  RobotOutlined,
  MessageOutlined,
  DeleteOutlined,
  SettingOutlined,
  ApiOutlined,
  BookOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store';
import type { NavKey } from '../types';

const { Sider, Content } = AntLayout;
const { Title, Text } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { key: 'install', icon: <DownloadOutlined />, label: '一键安装' },
  { key: 'ai-config', icon: <RobotOutlined />, label: 'AI配置' },
  { key: 'channel-config', icon: <MessageOutlined />, label: '渠道配置' },
  { key: 'uninstall', icon: <DeleteOutlined />, label: '卸载清理' },
  // { key: 'diagnose', icon: <MedicineBoxOutlined />, label: '一键诊断' }, // 暂时隐藏
  { key: 'settings', icon: <SettingOutlined />, label: '设置' },
  { key: 'channel-settings', icon: <ApiOutlined />, label: '渠道设置' },
  { key: 'plugin-manager', icon: <AppstoreOutlined />, label: '插件管理' },
  { key: 'guide', icon: <BookOutlined />, label: '使用说明' },
  { key: 'about', icon: <InfoCircleOutlined />, label: '关于' },
];

export default function Layout({ children }: LayoutProps) {
  const { currentNav, setCurrentNav, systemStatus } = useAppStore();

  const handleMenuClick = ({ key }: { key: string }) => {
    setCurrentNav(key as NavKey);
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        width={200}
        theme="light"
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          zIndex: 10,
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
              OpenClaw
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              安装助手
            </Text>
          </Space>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[currentNav]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />

        {/* 状态指示器 */}
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          padding: '16px',
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa'
        }}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>环境状态</Text>
            <Space size={4} wrap>
              <Tag 
                color={systemStatus.node.installed ? 'success' : 'default'}
                style={{ fontSize: 10, margin: 0 }}
              >
                Node
              </Tag>
              <Tag 
                color={systemStatus.git.installed ? 'success' : 'default'}
                style={{ fontSize: 10, margin: 0 }}
              >
                Git
              </Tag>
              <Tag 
                color={systemStatus.openclaw.installed ? 'success' : 'default'}
                style={{ fontSize: 10, margin: 0 }}
              >
                OpenClaw
              </Tag>
            </Space>
          </Space>
        </div>
      </Sider>

      {/* 主内容区 */}
      <AntLayout>
        <Content style={{ 
          background: '#f5f5f5',
          overflow: 'auto',
          height: '100vh'
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
