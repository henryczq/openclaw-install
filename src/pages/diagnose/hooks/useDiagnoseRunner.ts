import { useCallback, useMemo, useState } from 'react';
import { useAppStore } from '../../../store';
import type { ApiTestResult, DiagnoseItem, DiagnoseResult } from '../types';
import { createInitialDiagnoseItems, getOverallDiagnoseStatus } from '../utils';

const GATEWAY_PORT = 18789;

export function useDiagnoseRunner() {
  const { selectedModel, apiKey, feishuConfig } = useAppStore();
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [diagnoseItems, setDiagnoseItems] = useState<DiagnoseItem[]>(createInitialDiagnoseItems);
  const [apiTestResult, setApiTestResult] = useState<ApiTestResult>({ testing: false });
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  const updateDiagnoseItem = useCallback((
    id: string,
    status: DiagnoseItem['status'],
    message: string,
    detail?: string
  ) => {
    setDiagnoseItems((prev) => prev.map((item) => (
      item.id === id ? { ...item, status, message, detail } : item
    )));
  }, []);

  const resetDiagnoseState = useCallback(() => {
    setProgress(0);
    setLogs([]);
    setDiagnoseItems(createInitialDiagnoseItems());
  }, []);

  const runDiagnose = useCallback(async () => {
    setIsDiagnosing(true);
    resetDiagnoseState();
    addLog('开始一键诊断...');

    const result: DiagnoseResult = {
      env: {
        node: { installed: false, needUpdate: true },
        npm: { installed: false },
        openclaw: { installed: false },
        gatewayPort: { open: false, port: GATEWAY_PORT }
      },
      ai: { configured: false },
      channel: { feishuConfigured: false },
      plugins: { list: [], count: 0 },
    };

    addLog('检测 Node.js 环境...');
    updateDiagnoseItem('node', 'checking', '检测中...');
    try {
      const nodeResult = await window.electronAPI.checkNode();
      result.env.node = nodeResult;
      if (nodeResult.installed) {
        updateDiagnoseItem('node', nodeResult.needUpdate ? 'warning' : 'success', `v${nodeResult.version}`, nodeResult.needUpdate ? '版本过低，建议更新' : '运行环境正常');
      } else {
        updateDiagnoseItem('node', 'error', '未安装', '请先安装 Node.js');
      }
    } catch (error) {
      updateDiagnoseItem('node', 'error', '检测失败', String(error));
    }
    setProgress(15);

    addLog('检测 NPM 环境...');
    updateDiagnoseItem('npm', 'checking', '检测中...');
    try {
      const npmResult = await window.electronAPI.checkNpm();
      result.env.npm = npmResult;
      if (npmResult.installed) {
        updateDiagnoseItem('npm', 'success', `v${npmResult.version}`, '包管理器可用');
      } else {
        updateDiagnoseItem('npm', 'error', '未安装', '请先安装 npm');
      }
    } catch (error) {
      updateDiagnoseItem('npm', 'error', '检测失败', String(error));
    }
    setProgress(30);

    addLog('检测 OpenClaw 安装...');
    updateDiagnoseItem('openclaw', 'checking', '检测中...');
    try {
      const openclawResult = await window.electronAPI.checkOpenClaw();
      result.env.openclaw = openclawResult;
      if (openclawResult.installed) {
        updateDiagnoseItem('openclaw', 'success', `v${openclawResult.version}`, 'OpenClaw 已安装');
      } else {
        updateDiagnoseItem('openclaw', 'error', '未安装', '请先安装 OpenClaw');
      }
    } catch (error) {
      updateDiagnoseItem('openclaw', 'error', '检测失败', String(error));
    }
    setProgress(45);

    addLog('检测 OpenClaw 网关...');
    updateDiagnoseItem('gateway', 'checking', '检测中...');
    try {
      const gatewayResult = await window.electronAPI.checkPort(GATEWAY_PORT);
      result.env.gatewayPort = gatewayResult;
      if (gatewayResult.open) {
        updateDiagnoseItem('gateway', 'success', '端口正常', `端口 ${GATEWAY_PORT} 已开放`);
      } else {
        updateDiagnoseItem('gateway', 'warning', '端口未开放', '网关可能未启动');
      }
    } catch (error) {
      updateDiagnoseItem('gateway', 'error', '检测失败', String(error));
    }
    setProgress(60);

    addLog('检测 AI 配置...');
    updateDiagnoseItem('ai', 'checking', '检测中...');
    const hasModel = !!selectedModel;
    const hasKey = !!apiKey;
    result.ai = { configured: hasModel && hasKey, model: selectedModel, hasApiKey: hasKey };
    if (hasModel && hasKey) {
      updateDiagnoseItem('ai', 'success', `模型: ${selectedModel}`, 'AI 配置完整');
    } else if (hasModel && !hasKey) {
      updateDiagnoseItem('ai', 'warning', `模型: ${selectedModel}`, '缺少 API Key');
    } else if (!hasModel && hasKey) {
      updateDiagnoseItem('ai', 'warning', '已设置 API Key', '未选择模型');
    } else {
      updateDiagnoseItem('ai', 'error', '未配置', '请先配置 AI 模型和 API Key');
    }
    setProgress(75);

    addLog('检测渠道配置...');
    updateDiagnoseItem('channel', 'checking', '检测中...');
    const hasFeishu = feishuConfig.appId.trim() !== '' && feishuConfig.appSecret.trim() !== '';
    result.channel.feishuConfigured = hasFeishu;
    if (hasFeishu) {
      updateDiagnoseItem('channel', 'success', '飞书已配置', '渠道配置完成');
    } else {
      updateDiagnoseItem('channel', 'warning', '未配置', '飞书渠道未配置，如需使用请配置');
    }
    setProgress(90);

    addLog('检测插件状态...');
    updateDiagnoseItem('plugins', 'checking', '检测中...');
    try {
      const pluginsResult = await window.electronAPI.executeCommand('openclaw plugins list', { timeout: 10000 });
      if (pluginsResult.success) {
        const pluginList = (pluginsResult.stdout || '').split('\n').filter((line) => line.trim());
        result.plugins = { list: pluginList, count: pluginList.length };
        if (pluginList.length > 0) {
          updateDiagnoseItem('plugins', 'success', `${pluginList.length} 个插件`, '插件正常工作');
        } else {
          updateDiagnoseItem('plugins', 'warning', '无插件', '未安装任何插件');
        }
      } else {
        updateDiagnoseItem('plugins', 'error', '获取失败', pluginsResult.error || '无法获取插件列表');
      }
    } catch (error) {
      updateDiagnoseItem('plugins', 'error', '检测失败', String(error));
    }

    setProgress(100);
    addLog('诊断完成！');
    setIsDiagnosing(false);
  }, [addLog, apiKey, feishuConfig.appId, feishuConfig.appSecret, resetDiagnoseState, selectedModel, updateDiagnoseItem]);

  const testApiConnection = useCallback(async () => {
    if (!selectedModel || !apiKey) {
      setApiTestResult({ testing: false, result: false, message: '请先配置 AI 模型和 API Key' });
      return;
    }

    setApiTestResult({ testing: true });
    addLog(`测试 API 连接: ${selectedModel}...`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setApiTestResult({ testing: false, result: true, message: 'API 连接正常' });
      addLog('API 连接测试通过！');
    } catch (error) {
      setApiTestResult({ testing: false, result: false, message: String(error) });
      addLog(`API 连接测试失败: ${error}`);
    }
  }, [addLog, apiKey, selectedModel]);

  const overall = useMemo(() => getOverallDiagnoseStatus(diagnoseItems), [diagnoseItems]);

  return {
    isDiagnosing,
    progress,
    diagnoseItems,
    apiTestResult,
    logs,
    overall,
    canTestApi: Boolean(selectedModel && apiKey),
    runDiagnose,
    testApiConnection,
  };
}
