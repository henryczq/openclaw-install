import { ipcMain } from 'electron';
import {
  listChannels,
  saveChannel,
  deleteChannel,
  getChannel,
  createBinding,
  removeBinding,
  getChannelBindings,
  getFeishuPolicyOptions,
  getPolicyOptionDetail,
} from '../utils/openclaw-channel-manager.js';

export function registerChannelHandlers() {
  // 列出所有渠道
  ipcMain.handle('list-channels', async () => {
    try {
      const channels = listChannels();
      return { success: true, channels };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // 获取单个渠道详情
  ipcMain.handle('get-channel', async (event, channelId) => {
    try {
      const channel = getChannel(channelId);
      if (!channel) {
        return { success: false, message: 'Channel not found' };
      }
      return { success: true, channel };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // 保存渠道（新增或更新）
  ipcMain.handle('save-channel', async (event, params) => {
    try {
      const result = saveChannel(params);
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // 删除渠道
  ipcMain.handle('delete-channel', async (event, channelId) => {
    try {
      const result = deleteChannel(channelId);
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // 获取渠道绑定的 Agent 列表
  ipcMain.handle('get-channel-bindings', async (event, channelId, accountId) => {
    try {
      const bindings = getChannelBindings(channelId, accountId);
      return { success: true, bindings };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // 创建渠道与 Agent 的绑定
  ipcMain.handle('create-binding', async (event, agentId, channelId, accountId, peer) => {
    try {
      const result = createBinding(agentId, channelId, accountId, peer);
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // 删除渠道与 Agent 的绑定
  ipcMain.handle('remove-binding', async (event, agentId, channelId, accountId) => {
    try {
      const result = removeBinding(agentId, channelId, accountId);
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // 获取飞书策略选项
  ipcMain.handle('get-feishu-policy-options', async () => {
    try {
      const options = getFeishuPolicyOptions();
      return { success: true, options };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // 获取策略选项详情
  ipcMain.handle('get-policy-option-detail', async (event, policyType, value) => {
    try {
      const detail = getPolicyOptionDetail(policyType, value);
      return { success: true, detail };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });
}
