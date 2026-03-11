import { Card, Typography, Collapse, Tag, Table, Alert } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { aiConfigSteps } from '../data/guideData';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

export function AIConfigSection() {
  return (
    <Card id="ai-config" title={<><RobotOutlined /> AI配置</>} style={{ marginTop: 24 }}>
      <Paragraph>
        AI 配置页按提供商分为火山引擎、KIMI、自定义三个页签，支持保存配置和测试连接。
      </Paragraph>

      <Collapse>
        {aiConfigSteps.map(step => (
          <Panel header={step.title} key={step.key}>
            {step.models && (
              <>
                <Text strong>支持的模型：</Text>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={step.models}
                  columns={[
                    { title: '模型名称', dataIndex: 'name', key: 'name' },
                    { title: '提供商', dataIndex: 'provider', key: 'provider' },
                    { title: 'API端点', dataIndex: 'endpoint', key: 'endpoint' },
                  ]}
                />
              </>
            )}
            
            {step.auto && (
              <>
                <Text strong>自动获取流程：</Text>
                {step.auto.map((item, idx) => (
                  <div key={idx} style={{ marginTop: 8 }}>
                    <Tag color="green">{idx + 1}</Tag>
                    <Text>{item}</Text>
                  </div>
                ))}
              </>
            )}
            
            {step.manual && (
              <>
                <Text strong style={{ marginTop: 16, display: 'block' }}>手动获取流程：</Text>
                {step.manual.map((item, idx) => (
                  <div key={idx} style={{ marginTop: 8 }}>
                    <Tag>{idx + 1}</Tag>
                    <Text>{item}</Text>
                  </div>
                ))}
              </>
            )}
          </Panel>
        ))}
      </Collapse>

      <Alert
        message="配置提醒"
        description="保存 AI 配置会覆盖 OpenClaw 当前默认模型与相关 provider 配置。正式修改前，建议先在“设置 > 查看配置”中备份现有内容。"
        type="warning"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  );
}
