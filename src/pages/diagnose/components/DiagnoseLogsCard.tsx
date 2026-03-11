import { useEffect, useRef } from 'react';
import { Card, Typography } from 'antd';

const { Text } = Typography;

interface DiagnoseLogsCardProps {
  logs: string[];
}

export function DiagnoseLogsCard({ logs }: DiagnoseLogsCardProps) {
  const logsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card
      title="诊断日志"
      size="small"
      style={{ height: '100%' }}
    >
      <div
        ref={logsRef}
        style={{
          height: 600,
          overflow: 'auto',
          background: '#f5f5f5',
          padding: 12,
          fontFamily: 'monospace',
          fontSize: 12,
        }}
      >
        {logs.length === 0 ? (
          <Text type="secondary">点击"开始诊断"查看详细日志...</Text>
        ) : (
          logs.map((log, index) => (
            <div key={`${log}-${index}`} style={{ marginBottom: 4 }}>
              {log}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
