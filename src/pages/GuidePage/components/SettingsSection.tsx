import { Card, Typography, Table, Alert } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { settingsItems } from '../data/guideData';

const { Text, Paragraph } = Typography;

export function SettingsSection() {
  return (
    <Card id="settings" title={<><SettingOutlined /> 设置</>} style={{ marginTop: 24 }}>
      <Paragraph>
        设置页面用于管理 OpenClaw 的配置文件路径和其他全局设置。
      </Paragraph>

      <Text strong>配置项说明：</Text>
      <Table
        size="small"
        pagination={false}
        dataSource={settingsItems}
        rowKey="setting"
        columns={[
          { title: '设置项', dataIndex: 'setting', key: 'setting' },
          { title: '默认值', dataIndex: 'default', key: 'default', render: (text) => <code>{text}</code> },
          { title: '说明', dataIndex: 'desc', key: 'desc' },
        ]}
        style={{ marginTop: 16 }}
      />

      <Alert
        message="配置文件格式"
        description="openclaw.json 采用 JSON 格式，包含 models、agents、channels 等配置项。"
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  );
}
