export type ProviderTabKey = 'volcengine' | 'kimi' | 'custom';

export type Status = 'idle' | 'success' | 'error';

export interface ProviderConfigPayload {
  provider: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  modelName?: string;
}

export interface ConnectionTestPayload {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
}

export interface ProviderModelOption {
  value: string;
  label: string;
  desc: string;
}
