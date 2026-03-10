import { Card, Typography, Collapse, Tag, Table, Alert } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { aiConfigSteps } from '../data/guideData';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

export function AIConfigSection() {
  return (
    <Card id="ai-config" title={<><RobotOutlined /> AI配置</>} style={{ marginTop: 24 }}>
      <Paragraph>
        AI配置页面用于设置 OpenClaw 使用的大语言模型和 API 密钥。
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
        message="配置说明"
        description="支持火山引擎和 DeepSeek 两种提供商，配置会自动保存到 openclaw.json 文件中。"
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  );
}
