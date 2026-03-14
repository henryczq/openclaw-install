import { Card, Typography, Table, Alert } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { settingsItems } from '../data/guideData';

const { Text, Paragraph } = Typography;

export function SettingsSection() {
  return (
    <Card id="settings" title={<><SettingOutlined /> 设置</>} style={{ marginTop: 24 }}>
      <Paragraph>
        设置页目前分为模型设置、服务管理、查看配置，以及 Node.js / Git / OpenClaw 下载配置几个页签。
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
        message="使用建议"
        description="修改下载配置和配置文件内容后，请记得保存；服务管理页签依赖本机已经安装 OpenClaw。"
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  );
}
