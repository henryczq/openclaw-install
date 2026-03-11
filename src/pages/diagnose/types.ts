import type { ReactNode } from 'react';

export interface DiagnoseItem {
  id: string;
  name: string;
  status: 'pending' | 'checking' | 'success' | 'error' | 'warning';
  message: string;
  detail?: string;
  icon: ReactNode;
}

export interface DiagnoseResult {
  env: {
    node: { installed: boolean; version?: string; needUpdate: boolean };
    npm: { installed: boolean; version?: string };
    openclaw: { installed: boolean; version?: string };
    gatewayPort: { open: boolean; port: number };
  };
  ai: {
    configured: boolean;
    model?: string;
    hasApiKey?: boolean;
  };
  channel: {
    feishuConfigured: boolean;
  };
  plugins: {
    list: string[];
    count: number;
  };
}

export interface ApiTestResult {
  testing: boolean;
  result?: boolean;
  message?: string;
}

export interface OverallDiagnoseStatus {
  status: 'success' | 'error' | 'warning';
  title: string;
  subTitle: string;
}
