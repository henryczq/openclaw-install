import { Card, Descriptions, Typography } from 'antd';
import type { ConfigData } from '../types';

const { Text } = Typography;

interface MirrorInfoCardProps {
  mirrors: ConfigData['mirrors'];
}

export function MirrorInfoCard({ mirrors }: MirrorInfoCardProps) {
  return (
    <Card title="镜像源信息" style={{ marginTop: 24 }}>
      <Descriptions bordered size="small">
        <Descriptions.Item label="Node.js 主镜像">
          <Text copyable>{mirrors.nodejs.primary}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Node.js 备用镜像">
          <Text copyable>{mirrors.nodejs.backup}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Git 主镜像">
          <Text copyable>{mirrors.git.primary}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Git 备用镜像">
          <Text copyable>{mirrors.git.backup}</Text>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
