export type QqAction =
  | 'check-plugin'
  | 'install-plugin'
  | 'open-console'
  | 'check-login'
  | 'create-robot'
  | 'get-credentials'
  | 'bind-channel'
  | 'restart-service';

export interface QqProgressItem {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
}

const QQ_PROGRESS_TEMPLATES: Record<QqAction, QqProgressItem[]> = {
  'check-plugin': [
    { step: '检查QQ插件', status: 'pending' },
  ],
  'install-plugin': [
    { step: '执行安装命令', status: 'pending' },
    { step: '等待安装完成', status: 'pending' }
  ],
  'open-console': [
    { step: '打开QQ机器人管理页面', status: 'pending' },
  ],
  'check-login': [
    { step: '检查登录状态', status: 'pending' },
  ],
  'create-robot': [
    { step: '点击创建机器人', status: 'pending' },
    { step: '等待创建完成', status: 'pending' }
  ],
  'get-credentials': [
    { step: '获取AppID', status: 'pending' },
    { step: '获取AppSecret', status: 'pending' }
  ],
  'bind-channel': [
    { step: '执行绑定命令', status: 'pending' },
  ],
  'restart-service': [
    { step: '重启OpenClaw服务', status: 'pending' },
  ]
};

export function getQqRpaSteps(action: QqAction | null) {
  return action ? QQ_PROGRESS_TEMPLATES[action].map((item) => ({ ...item })) : [];
}

export function updateQqProgressItems(
  progress: QqProgressItem[],
  indexes: number | number[],
  patch: Partial<QqProgressItem>
) {
  const indexSet = new Set(Array.isArray(indexes) ? indexes : [indexes]);

  return progress.map((item, index) => (
    indexSet.has(index)
      ? { ...item, ...patch }
      : item
  ));
}

export function updateAllQqProgressItems(
  progress: QqProgressItem[],
  patch: Partial<QqProgressItem>
) {
  return progress.map((item) => ({ ...item, ...patch }));
}
