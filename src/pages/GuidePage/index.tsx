import { useRef } from 'react';
import { Card, Typography, Anchor, Space, Alert } from 'antd';
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
          本文档基于当前版本的实际页面能力整理，覆盖一键安装、AI 配置、QQ 渠道接入、设置页能力和卸载清理流程。
        </Paragraph>
        <Alert
          type="info"
          showIcon
          message="当前版本说明"
          description="QQ 渠道已接入主流程；飞书页面已拆分但仍处于开发中。OpenClaw 安装阶段会打开独立 PowerShell 窗口，请以窗口输出为准。"
        />
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
