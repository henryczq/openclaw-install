export interface SystemStatus {
  node: {
    installed: boolean;
    version?: string;
    needUpdate: boolean;
  };
  npm: {
    installed: boolean;
    version?: string;
  };
  git: {
    installed: boolean;
    version?: string;
    needUpdate: boolean;
  };
  openclaw: {
    installed: boolean;
    version?: string;
  };
}

export interface InstallStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
}

export interface AIModel {
  value: string;
  label: string;
}

export interface FeishuConfig {
  appName: string;
  appDesc: string;
  appId: string;
  appSecret: string;
}

export interface QqConfig {
  appId: string;
  appSecret: string;
}

export type NavKey = 'install' | 'ai-config' | 'channel-config' | 'uninstall' | 'diagnose' | 'settings' | 'guide' | 'about';
