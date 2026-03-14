import { Card, Typography, Collapse, Tag, Table, Alert } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { channelSteps } from '../data/guideData';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

export function ChannelSection() {
  return (
    <Card id="channel-config" title={<><MessageOutlined /> 渠道配置</>} style={{ marginTop: 24 }}>
      <Paragraph>
        渠道配置页面目前以 QQ 机器人接入为主流程，飞书入口已拆分但仍处于开发中。
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
        description="QQ 配置支持一键执行，也支持逐步操作。如果你已经在内置浏览器中登录过 QQ 管理后台，页面会优先尝试直接进入后续步骤。"
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  );
}
