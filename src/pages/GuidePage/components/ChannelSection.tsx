import { Card, Typography, Collapse, Tag, Table, Alert } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { channelSteps } from '../data/guideData';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

export function ChannelSection() {
  return (
    <Card id="channel-config" title={<><MessageOutlined /> 渠道配置</>} style={{ marginTop: 24 }}>
      <Paragraph>
        渠道配置用于设置 OpenClaw 与外部平台的连接，目前支持飞书渠道。
      </Paragraph>

      <Collapse>
        {channelSteps.map(step => (
          <Panel header={step.title} key={step.key}>
            <Text strong>触发条件：</Text>
            <Paragraph>{step.trigger}</Paragraph>
            
            {step.commands && (
              <>
                <Text strong>执行命令：</Text>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={step.commands}
                  columns={[
                    { title: '命令', dataIndex: 'cmd', key: 'cmd', render: (text) => <code>{text}</code> },
                    { title: '说明', dataIndex: 'desc', key: 'desc' },
                  ]}
                />
              </>
            )}
            
            {step.phases && (
              <>
                <Text strong>配置阶段：</Text>
                {step.phases.map((phase, idx) => (
                  <div key={idx} style={{ marginTop: 8 }}>
                    <Tag color="purple">{phase.name}</Tag>
                    <Text>{phase.detail}</Text>
                  </div>
                ))}
              </>
            )}
          </Panel>
        ))}
      </Collapse>

      <Alert
        message="注意事项"
        description="飞书配置需要管理员权限，请确保您有企业自建应用的创建权限。"
        type="warning"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  );
}
