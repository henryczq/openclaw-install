export interface DownloadConfig {
  name: string;
  description: string;
  version: string;
  autoDownload: {
    url: string | null;
    mirror: string | null;
    filename: string | null;
    note?: string;
  };
  manualDownload: {
    url: string;
    description: string;
  };
  installCommand?: string;
  minVersion: string;
}

export interface ConfigData {
  downloads: {
    nodejs: DownloadConfig;
    git: DownloadConfig;
    openclaw: DownloadConfig;
  };
  mirrors: {
    nodejs: {
      primary: string;
      backup: string;
    };
    git: {
      primary: string;
      backup: string;
    };
  };
}

export interface ConfigBackup {
  name: string;
  path: string;
  time: string;
}

export interface SettingsFormValues {
  nodejs_autoUrl: string;
  nodejs_manualUrl: string;
  git_autoUrl: string;
  git_manualUrl: string;
  openclaw_autoUrl?: string;
  openclaw_manualUrl: string;
  openclaw_configPath?: string;
}

export type DownloadConfigKey = keyof ConfigData['downloads'];
