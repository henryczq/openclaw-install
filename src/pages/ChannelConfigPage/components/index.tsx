import { FeishuConfig } from './FeishuConfig';
import { QqConfig } from './QqConfig';

export interface ChannelConfig {
  key: string;
  label: string;
}

export const channelConfigs: ChannelConfig[] = [
  { key: 'qq', label: 'QQ配置' },
  { key: 'feishu', label: '飞书配置' },
];

export function getChannelComponent(key: string) {
  switch (key) {
    case 'feishu':
      return <FeishuConfig />;
    case 'qq':
      return <QqConfig />;
    default:
      return null;
  }
}
