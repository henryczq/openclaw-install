import { Card, Typography, Collapse, Tag, Alert, Space } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { installSteps } from '../data/guideData';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

export function InstallSection() {
  return (
    <Card id="install" title={<><DownloadOutlined /> 一键安装</>}>
      <Paragraph>
        一键安装会按当前实际流程完成环境检测、依赖安装、OpenClaw 安装和默认配置初始化。
      </Paragraph>

      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Alert
          type="info"
          showIcon
          message="安装窗口说明"
          description="OpenClaw 安装阶段会启动独立 PowerShell 窗口；如果窗口仍在运行，请等待窗口内命令完成，再回到主界面继续观察结果。"
        />
        <Alert
          type="warning"
          showIcon
          message="建议做法"
          description="如果 Git 安装后页面提示需要重启应用，请按提示重启再继续；这样能避免 PATH 尚未刷新导致的后续失败。"
        />
      </Space>

      <Collapse>
        {installSteps.map(step => (
          <Panel header={step.title} key={step.key}>
            <Text strong>触发条件：</Text>
            <Paragraph>{step.trigger}</Paragraph>
            
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
