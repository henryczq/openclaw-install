import { Card, Typography, Table, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { uninstallSteps } from '../data/guideData';

const { Text, Paragraph } = Typography;

export function UninstallSection() {
  return (
    <Card id="uninstall" title={<><InfoCircleOutlined /> 卸载清理</>} style={{ marginTop: 24 }}>
      <Paragraph>
        卸载清理页面除了卸载 OpenClaw 主程序外，还支持检测安装残余、批量清理和逐项手动删除。
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
        description="清理安装残余可能会删除 .openclaw 配置目录、本地 wrapper 和全局命令入口；如果你有重要配置，请先备份。"
        type="error"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  );
}
