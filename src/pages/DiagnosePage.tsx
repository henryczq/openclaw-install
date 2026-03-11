import { Col, Row, Typography } from 'antd';
import { MedicineBoxOutlined } from '@ant-design/icons';
import { ApiConnectionCard } from './diagnose/components/ApiConnectionCard';
import { DiagnoseItemsCard } from './diagnose/components/DiagnoseItemsCard';
import { DiagnoseLogsCard } from './diagnose/components/DiagnoseLogsCard';
import { useDiagnoseRunner } from './diagnose/hooks/useDiagnoseRunner';

const { Title, Paragraph } = Typography;

export default function DiagnosePage() {
  const {
    isDiagnosing,
    progress,
    diagnoseItems,
    apiTestResult,
    logs,
    overall,
    canTestApi,
    runDiagnose,
    testApiConnection,
  } = useDiagnoseRunner();

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <MedicineBoxOutlined /> 一键诊断
      </Title>
      <Paragraph type="secondary">
        全面检测 OpenClaw 运行环境，帮助您快速定位问题。
      </Paragraph>

      <Row gutter={24}>
        <Col span={14}>
          <DiagnoseItemsCard
            items={diagnoseItems}
            isDiagnosing={isDiagnosing}
            progress={progress}
            overall={overall}
            onRunDiagnose={runDiagnose}
          />

          <ApiConnectionCard
            canTestApi={canTestApi}
            apiTestResult={apiTestResult}
            onTestConnection={testApiConnection}
          />
        </Col>

        <Col span={10}>
          <DiagnoseLogsCard logs={logs} />
        </Col>
      </Row>
    </div>
  );
}
