import { Card, Typography, Collapse, Tag, Table } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { installSteps } from '../data/guideData';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

export function InstallSection() {
  return (
    <Card id="install" title={<><DownloadOutlined /> 一键安装</>}>
      <Paragraph>
        一键安装功能自动完成 OpenClaw 运行环境的检测、下载、安装和配置。
      </Paragraph>

      <Collapse>
        {installSteps.map(step => (
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
            
            {step.steps && (
              <>
                <Text strong>执行步骤：</Text>
                {step.steps.map((s, idx) => (
                  <div key={idx} style={{ marginTop: 8 }}>
                    <Tag color="blue">{s.action}</Tag>
                    <Text>{s.detail}</Text>
                  </div>
                ))}
              </>
            )}
            
            {step.logic && (
              <>
                <Text strong style={{ marginTop: 16, display: 'block' }}>判断逻辑：</Text>
                <Paragraph>{step.logic}</Paragraph>
              </>
            )}
          </Panel>
        ))}
      </Collapse>
    </Card>
  );
}
