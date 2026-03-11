使用ModelManager类

import {
  listProviders,
  listModels,
  getModel,
  addModel,
  updateModel,
  deleteModel,
  deleteProvider,
  setDefaultModel,
  isDefaultModel,
} from './openclaw-model-manager';

// 1. 查看所有 Provider 和 Model
const providers = listProviders();
const models = listModels();

// 2. 删除模型（自动删除空 provider）
const result = deleteModel('deepseek', 'deepseek-chat');
if (result.providerEmpty && !result.providerDeleted) {
  // 提示用户：Provider 已空，是否删除？
  // 用户确认后调用：deleteProvider('deepseek')
}

// 3. 编辑模型（先获取，再更新）
const model = getModel('deepseek', 'deepseek-chat');
updateModel({
  providerId: 'deepseek',
  modelId: 'deepseek-chat',
  modelName: 'New Name',
  contextWindow: 64000,
});

// 4. 设置默认模型
setDefaultModel('deepseek', 'deepseek-chat');

// 5. 检查是否为默认
const isDefault = isDefaultModel('deepseek', 'deepseek-chat');