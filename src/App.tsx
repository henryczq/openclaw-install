import { App as AntdApp, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout';
import InstallPage from './pages/InstallPage';
import AIConfigPage from './pages/AIConfigPage';
import ChannelConfigPage from './pages/ChannelConfigPage';
import UninstallPage from './pages/UninstallPage';
import DiagnosePage from './pages/DiagnosePage';
import SettingsPage from './pages/SettingsPage';
import ChannelSettingsPage from './pages/ChannelSettingsPage';
import PluginManagerPage from './pages/PluginManagerPage';
import GuidePage from './pages/GuidePage';
import AboutPage from './pages/AboutPage';
import { useAppStore } from './store';

function App() {
  const { currentNav } = useAppStore();

  const renderContent = () => {
    switch (currentNav) {
      case 'install':
        return <InstallPage />;
      case 'ai-config':
        return <AIConfigPage />;
      case 'channel-config':
        return <ChannelConfigPage />;
      case 'uninstall':
        return <UninstallPage />;
      case 'diagnose':
        return <DiagnosePage />;
      case 'settings':
        return <SettingsPage />;
      case 'channel-settings':
        return <ChannelSettingsPage />;
      case 'plugin-manager':
        return <PluginManagerPage />;
      case 'guide':
        return <GuidePage />;
      case 'about':
        return <AboutPage />;
      default:
        return <InstallPage />;
    }
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <AntdApp>
        <Layout>
          {renderContent()}
        </Layout>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
