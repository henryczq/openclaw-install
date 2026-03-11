import type { ProviderModelOption } from './types';

export const VOLCENGINE_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/coding/v3';
export const KIMI_ENDPOINT = 'https://api.moonshot.cn/v1';

export const VOLCENGINE_MODELS: ProviderModelOption[] = [
  { value: 'doubao-seed-2.0-code', label: '豆包 Seed 2.0 Code', desc: '代码生成专用模型' },
  { value: 'doubao-seed-2.0-pro', label: '豆包 Seed 2.0 Pro', desc: '专业版通用模型' },
  { value: 'doubao-seed-2.0-lite', label: '豆包 Seed 2.0 Lite', desc: '轻量版快速响应' },
  { value: 'doubao-seed-code', label: '豆包 Seed Code', desc: '代码辅助模型' },
  { value: 'minimax-m2.5', label: 'MiniMax M2.5', desc: 'MiniMax大模型' },
  { value: 'glm-4.7', label: 'GLM-4.7', desc: '智谱AI大模型' },
  { value: 'deepseek-v3.2', label: 'DeepSeek V3.2', desc: '深度求索大模型' },
  { value: 'kimi-k2.5', label: 'Kimi K2.5', desc: '月之暗面大模型' },
];

export const KIMI_MODELS: ProviderModelOption[] = [
  { value: 'kimi-k2.5', label: 'Kimi K2.5', desc: 'Kimi 迄今最智能的模型，支持视觉与文本输入，上下文 256k' },
  { value: 'kimi-k2-0905-preview', label: 'Kimi K2 0905', desc: '上下文长度 256k，增强 Agentic Coding 能力' },
  { value: 'kimi-k2-0711-preview', label: 'Kimi K2 0711', desc: '上下文长度 128k，MoE 架构，超强代码和 Agent 能力' },
  { value: 'kimi-k2-turbo-preview', label: 'Kimi K2 Turbo', desc: 'K2 高速版本，输出速度每秒 60-100 tokens，上下文 256k' },
  { value: 'kimi-k2-thinking', label: 'Kimi K2 Thinking', desc: 'K2 长思考模型，支持多步工具调用，上下文 256k' },
  { value: 'kimi-k2-thinking-turbo', label: 'Kimi K2 Thinking Turbo', desc: 'K2 长思考高速版，深度推理，输出速度每秒 60-100 tokens' },
  { value: 'moonshot-v1-8k', label: 'Moonshot V1 8K', desc: '适用于生成短文本，上下文长度 8k' },
  { value: 'moonshot-v1-32k', label: 'Moonshot V1 32K', desc: '适用于生成长文本，上下文长度 32k' },
  { value: 'moonshot-v1-128k', label: 'Moonshot V1 128K', desc: '适用于生成超长文本，上下文长度 128k' },
  { value: 'moonshot-v1-8k-vision-preview', label: 'Moonshot V1 8K Vision', desc: 'Vision 视觉模型，理解图片内容，上下文 8k' },
  { value: 'moonshot-v1-32k-vision-preview', label: 'Moonshot V1 32K Vision', desc: 'Vision 视觉模型，理解图片内容，上下文 32k' },
];
