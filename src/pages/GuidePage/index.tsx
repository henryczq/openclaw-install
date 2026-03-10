import { useRef } from 'react';
import { Card, Typography, Anchor, Space } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { InstallSection } from './components/InstallSection';
import { AIConfigSection } from './components/AIConfigSection';
import { ChannelSection } from './components/ChannelSection';
import { SettingsSection } from './components/SettingsSection';
import { UninstallSection } from './components/UninstallSection';
import { anchorItems } from './data/guideData';

const { Title, Paragraph } = Typography;

export default function GuidePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ padding: '24px', position: 'relative' }} ref={containerRef}>
      <Card>
        <Title level={2}>
          <BookOutlined /> 使用说明
        </Title>
        <Paragraph>
          本文档详细介绍 OpenClaw 安装器的各项功能和使用方法。
        </Paragraph>
      </Card>

      <Space direction="vertical" style={{ width: '100%', marginTop: 24 }} size="large">
        <InstallSection />
        <AIConfigSection />
        <ChannelSection />
        <SettingsSection />
        <UninstallSection />
      </Space>

      <Anchor
        style={{ position: 'fixed', right: 20, top: 100, width: 150 }}
        affix={false}
        getContainer={() => containerRef.current || window}
        items={anchorItems}
      />
    </div>
  );
}
