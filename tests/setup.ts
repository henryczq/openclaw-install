import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock electronAPI
declare global {
  interface Window {
    electronAPI: any
  }
}

// 全局 mock electronAPI
window.electronAPI = {
  executeCommand: vi.fn(),
  checkNode: vi.fn(),
  checkNpm: vi.fn(),
  checkGit: vi.fn(),
  checkOpenClaw: vi.fn(),
  setNpmRegistry: vi.fn(),
  configGitProxy: vi.fn(),
  downloadFile: vi.fn(),
  downloadFileWithProgress: vi.fn(),
  openExternal: vi.fn(),
  showMessageBox: vi.fn(),
  getSystemInfo: vi.fn(),
  installOpenClaw: vi.fn(),
  openclawOnboard: vi.fn(),
  configOpenClawAI: vi.fn(),
  readOpenClawConfig: vi.fn(),
  testAIConnection: vi.fn(),
  getVolcengineApiKey: vi.fn(),
  fetchVolcengineApiKey: vi.fn(),
  getKimiApiKey: vi.fn(),
  setFeishuInstallProgressHandler: vi.fn(),
  clearFeishuInstallProgressHandler: vi.fn(),
  setFeishuRpaProgressHandler: vi.fn(),
  clearFeishuRpaProgressHandler: vi.fn(),
  feishuLogin: vi.fn(),
  feishuCreateApp: vi.fn(),
  feishuConfigPermissions: vi.fn(),
  feishuPublishVersion: vi.fn(),
  feishuSubscribeEvents: vi.fn(),
  feishuGetCredentials: vi.fn(),
  openFeishuConsole: vi.fn(),
  installFeishuPlugin: vi.fn(),
  configFeishuChannel: vi.fn(),
  restartOpenClaw: vi.fn(),
  uninstallOpenClaw: vi.fn(),
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock console methods in test environment
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
}
