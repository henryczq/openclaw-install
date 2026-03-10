import { Typography, Spin, Tabs, Alert } from 'antd';
import { useState } from 'react';
import { useChannelConfig } from './hooks/useChannelConfig';
import { channelConfigs, getChannelComponent } from './components';

const { Title, Text } = Typography;

// 错误边界组件
function ErrorFallback({ error }: { error: Error }) {
  return (
    <Alert
      message="组件渲染错误"
      description={error.message}
      type="error"
      showIcon
    />
  );
}

export default function ChannelConfigPage() {
  const [activeTab, setActiveTab] = useState('qq');
  const [renderError, setRenderError] = useState<Error | null>(null);
  
  let isChecking = false;
  try {
    const channelConfig = useChannelConfig();
    isChecking = channelConfig.isChecking;
  } catch (error) {
    console.error('[ChannelConfigPage] useChannelConfig error:', error);
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="初始化错误"
          description={error instanceof Error ? error.message : String(error)}
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (isChecking) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', marginTop: 100 }}>
        <Spin size="large" />
        <Text style={{ display: 'block', marginTop: 16 }}>正在检查插件状态...</Text>
      </div>
    );
  }

  if (renderError) {
    return (
      <div style={{ padding: '24px' }}>
        <ErrorFallback error={renderError} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>渠道配置</Title>
      <Text type="secondary">配置飞书或QQ渠道，让 OpenClaw 可以通过机器人与用户交互</Text>

      <div style={{ marginTop: 24 }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          items={channelConfigs.map(config => ({
            key: config.key,
            label: config.label,
            children: (
              <ErrorBoundary onError={setRenderError}>
                {getChannelComponent(config.key)}
              </ErrorBoundary>
            )
          }))} 
        />
      </div>
    </div>
  );
}

// 简单的错误边界包装器
function ErrorBoundary({ children, onError }: { children: React.ReactNode; onError: (error: Error) => void }) {
  try {
    return <>{children}</>;
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}
