import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import type { FormInstance } from 'antd';
import defaultDownloadConfig from '../../../config/downloads.json';
import type { ConfigBackup, ConfigData, SettingsFormValues } from '../types';

function buildFormValues(config: ConfigData, configPath = ''): SettingsFormValues {
  return {
    nodejs_autoUrl: config.downloads.nodejs.autoDownload.url || '',
    nodejs_manualUrl: config.downloads.nodejs.manualDownload.url,
    git_autoUrl: config.downloads.git.autoDownload.url || '',
    git_manualUrl: config.downloads.git.manualDownload.url,
    openclaw_manualUrl: config.downloads.openclaw.manualDownload.url,
    openclaw_configPath: configPath,
  };
}

function normalizeBackups(backups: Array<{ name: string; path: string; time: Date | string }>) {
  return backups.map((backup) => ({
    ...backup,
    time: new Date(backup.time).toLocaleString()
  }));
}

function getInitialConfig() {
  const savedConfig = localStorage.getItem('openclaw-download-config');
  if (!savedConfig) {
    return defaultDownloadConfig as ConfigData;
  }

  try {
    return JSON.parse(savedConfig) as ConfigData;
  } catch (error) {
    console.error('加载配置失败:', error);
    return defaultDownloadConfig as ConfigData;
  }
}

export function useSettingsConfig(form: FormInstance<SettingsFormValues>) {
  const [config, setConfig] = useState<ConfigData>(getInitialConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const [configPath, setConfigPath] = useState('');
  const [configContent, setConfigContent] = useState('');
  const [backups, setBackups] = useState<ConfigBackup[]>([]);

  useEffect(() => {
    if (window.electronAPI?.getConfigPath) {
      window.electronAPI.getConfigPath().then((result) => {
        const nextConfigPath = result?.path || '';
        setConfigPath(nextConfigPath);
        form.setFieldsValue(buildFormValues(config, nextConfigPath));
      });
      return;
    }

    form.setFieldsValue(buildFormValues(config));
  }, [config, form]);

  const loadConfigAndBackups = useCallback(async () => {
    console.log('[Settings] 开始加载配置和备份...');
    
    if (!window.electronAPI) {
      console.error('[Settings] Electron API 未初始化');
      return;
    }

    if (!window.electronAPI.readOpenClawConfig || !window.electronAPI.listBackups) {
      message.error('检测到应用未完全重启，请关闭并重新打开应用以加载新功能');
      setConfigContent('// 请重启应用以加载配置查看功能');
      return;
    }

    try {
      const configResult = await window.electronAPI.readOpenClawConfig();
      console.log('[Settings] 配置加载结果:', configResult);
      
      if (configResult.success && configResult.config) {
        setConfigContent(JSON.stringify(configResult.config, null, 2));
      } else {
        setConfigContent('// 配置文件不存在或为空');
      }

      const backupsResult = await window.electronAPI.listBackups();
      console.log('[Settings] 备份列表结果:', backupsResult);
      
      if (backupsResult.success && backupsResult.backups) {
        setBackups(normalizeBackups(backupsResult.backups));
        console.log('[Settings] 备份数量:', backupsResult.backups.length);
      } else {
        console.log('[Settings] 没有备份或加载失败');
        setBackups([]);
      }
    } catch (error) {
      console.error('[Settings] Failed to load config:', error);
      message.error('加载配置文件失败');
    }
  }, []);

  const handleValuesChange = useCallback(() => {
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();

      if (values.openclaw_configPath && values.openclaw_configPath !== configPath && window.electronAPI?.setConfigPath) {
        const result = await window.electronAPI.setConfigPath(values.openclaw_configPath);
        if (result.success && result.path) {
          setConfigPath(result.path);
          message.success('OpenClaw 配置文件路径已更新');
        } else {
          message.error(`路径更新失败: ${result.error}`);
        }
      }

      const newConfig: ConfigData = {
        ...config,
        downloads: {
          nodejs: {
            ...config.downloads.nodejs,
            autoDownload: {
              ...config.downloads.nodejs.autoDownload,
              url: values.nodejs_autoUrl,
            },
            manualDownload: {
              ...config.downloads.nodejs.manualDownload,
              url: values.nodejs_manualUrl,
            },
          },
          git: {
            ...config.downloads.git,
            autoDownload: {
              ...config.downloads.git.autoDownload,
              url: values.git_autoUrl,
            },
            manualDownload: {
              ...config.downloads.git.manualDownload,
              url: values.git_manualUrl,
            },
          },
          openclaw: {
            ...config.downloads.openclaw,
            manualDownload: {
              ...config.downloads.openclaw.manualDownload,
              url: values.openclaw_manualUrl,
            },
          },
        },
      };

      localStorage.setItem('openclaw-download-config', JSON.stringify(newConfig));
      setConfig(newConfig);
      setHasChanges(false);
      message.success('配置已保存');
    } catch {
      message.error('保存失败，请检查输入');
    }
  }, [config, configPath, form]);

  const handleReset = useCallback(() => {
    const defaultConfig = defaultDownloadConfig as ConfigData;
    setConfig(defaultConfig);
    form.setFieldsValue(buildFormValues(defaultConfig, configPath));
    localStorage.removeItem('openclaw-download-config');
    setHasChanges(false);
    message.success('已恢复默认配置');
  }, [configPath, form]);

  const handleSaveConfigContent = useCallback(async () => {
    try {
      JSON.parse(configContent);
  
      if (!window.electronAPI) {
        message.error('Electron API 未初始化，请重启应用');
        return;
      }
  
      if (!window.electronAPI.saveRawConfig) {
        message.error('保存功能未初始化，请重启应用');
        return;
      }
  
      console.log('[Settings] 开始保存配置...');
      const result = await window.electronAPI.saveRawConfig(configContent);
      console.log('[Settings] 保存结果:', result);
        
      if (result.success) {
        message.success('配置已保存并备份');
        console.log('[Settings] 重新加载配置和备份列表...');
        await loadConfigAndBackups();
        console.log('[Settings] 加载完成');
      } else {
        message.error(`保存失败：${result.error}`);
      }
    } catch (error) {
      console.error('[Settings] 保存配置失败:', error);
      message.error('JSON 格式错误，请检查后再保存');
    }
  }, [configContent, loadConfigAndBackups]);

  const handleRestoreBackup = useCallback(async (backupPath: string) => {
    if (window.electronAPI?.restoreBackup) {
      const result = await window.electronAPI.restoreBackup(backupPath);
      if (result.success) {
        message.success('配置已恢复');
        await loadConfigAndBackups();
      } else {
        message.error(`恢复失败: ${result.error}`);
      }
    }
  }, [loadConfigAndBackups]);

  const openUrl = useCallback((url: string) => {
    if (!url) {
      return;
    }
    if (window.electronAPI) {
      window.electronAPI.openExternal(url);
      return;
    }
    window.open(url, '_blank');
  }, []);

  return {
    config,
    hasChanges,
    configPath,
    configContent,
    backups,
    setConfigContent,
    handleValuesChange,
    handleSave,
    handleReset,
    handleSaveConfigContent,
    handleRestoreBackup,
    loadConfigAndBackups,
    openUrl,
  };
}
