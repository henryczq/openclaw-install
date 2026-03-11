import { Button, Card, Divider, List, Progress, Result, Space, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { getDiagnoseStatusIcon } from '../utils';
import type { DiagnoseItem, OverallDiagnoseStatus } from '../types';

const { Text } = Typography;

interface DiagnoseItemsCardProps {
  items: DiagnoseItem[];
  isDiagnosing: boolean;
  progress: number;
  overall: OverallDiagnoseStatus | null;
  onRunDiagnose: () => void;
}

export function DiagnoseItemsCard({
  items,
  isDiagnosing,
  progress,
  overall,
  onRunDiagnose,
}: DiagnoseItemsCardProps) {
  return (
    <Card
      title="诊断项目"
      extra={(
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={onRunDiagnose}
          loading={isDiagnosing}
          disabled={isDiagnosing}
        >
          {isDiagnosing ? '诊断中...' : '开始诊断'}
        </Button>
      )}
    >
      {isDiagnosing && (
        <Progress percent={progress} status="active" style={{ marginBottom: 16 }} />
      )}

      <List
        itemLayout="horizontal"
        dataSource={items}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={getDiagnoseStatusIcon(item.status)}
              title={(
                <Space>
                  {item.icon}
                  <Text strong>{item.name}</Text>
                  <Tag color={
                    item.status === 'success' ? 'success'
                      : item.status === 'error' ? 'error'
                        : item.status === 'warning' ? 'warning'
                          : 'default'
                  }
                  >
                    {item.message}
                  </Tag>
                </Space>
              )}
              description={item.detail && <Text type="secondary">{item.detail}</Text>}
            />
          </List.Item>
        )}
      />

      {overall && !isDiagnosing && (
        <>
          <Divider />
          <Result
            status={overall.status}
            title={overall.title}
            subTitle={overall.subTitle}
          />
        </>
      )}
    </Card>
  );
}
