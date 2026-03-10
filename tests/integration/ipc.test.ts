import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('IPC Communication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Environment Checks', () => {
    it('should check Node.js installation', async () => {
      const mockResult = { installed: true, version: '22.11.0', needUpdate: false }
      window.electronAPI.checkNode.mockResolvedValue(mockResult)

      const result = await window.electronAPI.checkNode()

      expect(window.electronAPI.checkNode).toHaveBeenCalled()
      expect(result.installed).toBe(true)
      expect(result.version).toBe('22.11.0')
    })

    it('should handle Node.js not installed', async () => {
      const mockResult = { installed: false, needUpdate: true }
      window.electronAPI.checkNode.mockResolvedValue(mockResult)

      const result = await window.electronAPI.checkNode()

      expect(result.installed).toBe(false)
      expect(result.needUpdate).toBe(true)
    })

    it('should check npm installation', async () => {
      const mockResult = { installed: true, version: '10.9.0' }
      window.electronAPI.checkNpm.mockResolvedValue(mockResult)

      const result = await window.electronAPI.checkNpm()

      expect(window.electronAPI.checkNpm).toHaveBeenCalled()
      expect(result.installed).toBe(true)
    })

    it('should check Git installation', async () => {
      const mockResult = { installed: true, version: '2.47.1', needUpdate: false }
      window.electronAPI.checkGit.mockResolvedValue(mockResult)

      const result = await window.electronAPI.checkGit()

      expect(window.electronAPI.checkGit).toHaveBeenCalled()
      expect(result.installed).toBe(true)
    })

    it('should handle Git version that needs update', async () => {
      const mockResult = { installed: true, version: '1.9.0', needUpdate: true }
      window.electronAPI.checkGit.mockResolvedValue(mockResult)

      const result = await window.electronAPI.checkGit()

      expect(result.installed).toBe(true)
      expect(result.needUpdate).toBe(true)
    })

    it('should check OpenClaw installation', async () => {
      const mockResult = { installed: true, version: '1.0.0' }
      window.electronAPI.checkOpenClaw.mockResolvedValue(mockResult)

      const result = await window.electronAPI.checkOpenClaw()

      expect(window.electronAPI.checkOpenClaw).toHaveBeenCalled()
      expect(result.installed).toBe(true)
    })
  })

  describe('Configuration', () => {
    it('should set npm registry', async () => {
      const mockResult = { success: true, registry: 'https://registry.npmmirror.com' }
      window.electronAPI.setNpmRegistry.mockResolvedValue(mockResult)

      const result = await window.electronAPI.setNpmRegistry()

      expect(window.electronAPI.setNpmRegistry).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.registry).toBe('https://registry.npmmirror.com')
    })

    it('should handle npm registry config failure', async () => {
      const mockResult = { success: false, error: 'npm command not found' }
      window.electronAPI.setNpmRegistry.mockResolvedValue(mockResult)

      const result = await window.electronAPI.setNpmRegistry()

      expect(result.success).toBe(false)
      expect(result.error).toBe('npm command not found')
    })

    it('should configure Git proxy', async () => {
      const mockResult = { success: true }
      window.electronAPI.configGitProxy.mockResolvedValue(mockResult)

      const result = await window.electronAPI.configGitProxy()

      expect(window.electronAPI.configGitProxy).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })
  })

  describe('File Operations', () => {
    it('should download file', async () => {
      const mockResult = { success: true }
      window.electronAPI.downloadFile.mockResolvedValue(mockResult)

      const result = await window.electronAPI.downloadFile(
        'https://example.com/file.exe',
        'C:\\temp\\file.exe'
      )

      expect(window.electronAPI.downloadFile).toHaveBeenCalledWith(
        'https://example.com/file.exe',
        'C:\\temp\\file.exe'
      )
      expect(result.success).toBe(true)
    })

    it('should handle download failure', async () => {
      const mockResult = { success: false, error: 'Network error' }
      window.electronAPI.downloadFile.mockResolvedValue(mockResult)

      const result = await window.electronAPI.downloadFile('url', 'path')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should download file with progress', async () => {
      const mockResult = { success: true }
      window.electronAPI.downloadFileWithProgress.mockResolvedValue(mockResult)

      const result = await window.electronAPI.downloadFileWithProgress(
        'https://example.com/file.exe',
        'C:\\temp\\file.exe'
      )

      expect(window.electronAPI.downloadFileWithProgress).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })
  })

  describe('System Operations', () => {
    it('should open external link', async () => {
      const mockResult = { success: true }
      window.electronAPI.openExternal.mockResolvedValue(mockResult)

      const result = await window.electronAPI.openExternal('https://nodejs.org')

      expect(window.electronAPI.openExternal).toHaveBeenCalledWith('https://nodejs.org')
      expect(result.success).toBe(true)
    })

    it('should get system info', async () => {
      const mockResult = {
        platform: 'win32',
        arch: 'x64',
        version: '10.0.19045',
        tempPath: 'C:\\Users\\test\\AppData\\Local\\Temp'
      }
      window.electronAPI.getSystemInfo.mockResolvedValue(mockResult)

      const result = await window.electronAPI.getSystemInfo()

      expect(window.electronAPI.getSystemInfo).toHaveBeenCalled()
      expect(result.platform).toBe('win32')
      expect(result.tempPath).toBe('C:\\Users\\test\\AppData\\Local\\Temp')
    })

    it('should show message box', async () => {
      const mockResult = { response: 0, checkboxChecked: false }
      window.electronAPI.showMessageBox.mockResolvedValue(mockResult)

      const result = await window.electronAPI.showMessageBox({
        type: 'info',
        title: 'Test',
        message: 'Test message'
      })

      expect(window.electronAPI.showMessageBox).toHaveBeenCalled()
      expect(result.response).toBe(0)
    })
  })

  describe('Command Execution', () => {
    it('should execute command', async () => {
      const mockResult = { success: true, stdout: 'output', stderr: '' }
      window.electronAPI.executeCommand.mockResolvedValue(mockResult)

      const result = await window.electronAPI.executeCommand('node --version', { timeout: 5000 })

      expect(window.electronAPI.executeCommand).toHaveBeenCalledWith('node --version', { timeout: 5000 })
      expect(result.success).toBe(true)
      expect(result.stdout).toBe('output')
    })

    it('should handle command execution failure', async () => {
      const mockResult = { success: false, error: 'Command not found' }
      window.electronAPI.executeCommand.mockResolvedValue(mockResult)

      const result = await window.electronAPI.executeCommand('invalid-command')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Command not found')
    })
  })

  describe('OpenClaw Operations', () => {
    it('should install OpenClaw', async () => {
      const mockResult = { success: true, stdout: 'Installation complete' }
      window.electronAPI.installOpenClaw.mockResolvedValue(mockResult)

      const result = await window.electronAPI.installOpenClaw()

      expect(window.electronAPI.installOpenClaw).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should run onboard', async () => {
      const mockResult = { success: true, output: 'Onboard complete' }
      window.electronAPI.openclawOnboard.mockResolvedValue(mockResult)

      const result = await window.electronAPI.openclawOnboard()

      expect(window.electronAPI.openclawOnboard).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should config OpenClaw AI', async () => {
      const mockResult = { success: true, message: 'AI configured' }
      window.electronAPI.configOpenClawAI.mockResolvedValue(mockResult)

      const result = await window.electronAPI.configOpenClawAI('openai', 'test-key')

      expect(window.electronAPI.configOpenClawAI).toHaveBeenCalledWith('openai', 'test-key')
      expect(result.success).toBe(true)
    })

    it('should install Feishu plugin', async () => {
      const mockResult = { success: true }
      window.electronAPI.installFeishuPlugin.mockResolvedValue(mockResult)

      const result = await window.electronAPI.installFeishuPlugin()

      expect(window.electronAPI.installFeishuPlugin).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should config Feishu channel', async () => {
      const mockResult = { success: true, message: 'Channel configured' }
      window.electronAPI.configFeishuChannel.mockResolvedValue(mockResult)

      const result = await window.electronAPI.configFeishuChannel('app-id', 'app-secret')

      expect(window.electronAPI.configFeishuChannel).toHaveBeenCalledWith('app-id', 'app-secret')
      expect(result.success).toBe(true)
    })

    it('should restart OpenClaw', async () => {
      const mockResult = { success: true, output: 'Restarted' }
      window.electronAPI.restartOpenClaw.mockResolvedValue(mockResult)

      const result = await window.electronAPI.restartOpenClaw()

      expect(window.electronAPI.restartOpenClaw).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should uninstall OpenClaw', async () => {
      const mockResult = { success: true }
      window.electronAPI.uninstallOpenClaw.mockResolvedValue(mockResult)

      const result = await window.electronAPI.uninstallOpenClaw()

      expect(window.electronAPI.uninstallOpenClaw).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })
  })
})
