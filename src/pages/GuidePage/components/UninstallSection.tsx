import { Card, Typography, Table, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { uninstallSteps } from '../data/guideData';

const { Text, Paragraph } = Typography;

export function UninstallSection() {
  return (
    <Card id="uninstall" title={<><InfoCircleOutlined /> 卸载清理</>} style={{ marginTop: 24 }}>
      <Paragraph>
        提供干净的软件卸载功能，删除 OpenClaw 及其配置。
      </Paragraph>

      <Text strong>卸载步骤：</Text>
      <Table
        size="small"
        pagination={false}
        dataSource={uninstallSteps}
        rowKey="step"
        columns={[
          { title: '步骤', dataIndex: 'step', key: 'step' },
          { title: '命令', dataIndex: 'command', key: 'command', render: (text) => <code>{text}</code> },
          { title: '说明', dataIndex: 'desc', key: 'desc' },
        ]}
        style={{ marginTop: 16 }}
      />

      <Alert
        message="警告"
        description="卸载操作将删除所有配置和数据，请确保已备份重要信息！"
        type="error"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  );
}
