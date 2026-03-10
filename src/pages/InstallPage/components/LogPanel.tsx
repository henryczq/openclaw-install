import { useEffect, useRef } from 'react';
import { Card, Button, Typography } from 'antd';

const { Text } = Typography;

interface LogPanelProps {
  logs: string[];
  onClear: () => void;
}

export function LogPanel({ logs, onClear }: LogPanelProps) {
  const logsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card 
      title="安装日志" 
      size="small"
      extra={
        <Button size="small" onClick={onClear}>
          清空日志
        </Button>
      }
      style={{ height: '100%' }}
    >
      <div 
        ref={logsRef}
        style={{ 
          height: 500, 
          overflow: 'auto', 
          background: '#f5f5f5', 
          padding: 12,
          fontFamily: 'monospace',
          fontSize: 12
        }}
      >
        {logs.length === 0 ? (
          <Text type="secondary">暂无日志...</Text>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ marginBottom: 4 }}>
              {log}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
