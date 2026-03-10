import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../../src/store'

describe('App Store', () => {
  beforeEach(() => {
    // 重置 store 状态
    useAppStore.setState({
      systemStatus: {
        node: { installed: false, needUpdate: false },
        npm: { installed: false },
        git: { installed: false, needUpdate: false },
        openclaw: { installed: false },
      },
      installSteps: [
        { id: 'check-env', title: '环境检测', description: '检测系统环境', status: 'pending' },
        { id: 'install-node', title: '安装Node.js', description: '安装Node.js运行环境', status: 'pending' },
        { id: 'config-npm', title: '配置npm', description: '配置npm国内镜像源', status: 'pending' },
        { id: 'install-git', title: '安装Git', description: '安装Git版本控制工具', status: 'pending' },
        { id: 'install-openclaw', title: '安装OpenClaw', description: '安装OpenClaw主程序', status: 'pending' },
        { id: 'onboard', title: '初始化配置', description: '运行OpenClaw初始化配置', status: 'pending' },
      ],
      logs: [],
      selectedModel: 'doubao-seed-2.0-code',
      apiKey: '',
      feishuConfig: { appId: '', appSecret: '' },
      currentNav: 'install',
    })
  })

  describe('System Status', () => {
    it('应该更新 node 状态', () => {
      const store = useAppStore.getState()
      store.setSystemStatus({
        node: { installed: true, version: '22.11.0', needUpdate: false }
      })
      
      expect(useAppStore.getState().systemStatus.node.installed).toBe(true)
      expect(useAppStore.getState().systemStatus.node.version).toBe('22.11.0')
    })

    it('应该更新 git 状态', () => {
      const store = useAppStore.getState()
      store.setSystemStatus({
        git: { installed: true, version: '2.47.1', needUpdate: false }
      })
      
      expect(useAppStore.getState().systemStatus.git.installed).toBe(true)
      expect(useAppStore.getState().systemStatus.git.version).toBe('2.47.1')
    })

    it('应该更新 npm 状态', () => {
      const store = useAppStore.getState()
      store.setSystemStatus({
        npm: { installed: true, version: '10.9.0' }
      })
      
      expect(useAppStore.getState().systemStatus.npm.installed).toBe(true)
      expect(useAppStore.getState().systemStatus.npm.version).toBe('10.9.0')
    })

    it('应该更新 openclaw 状态', () => {
      const store = useAppStore.getState()
      store.setSystemStatus({
        openclaw: { installed: true, version: '1.0.0' }
      })
      
      expect(useAppStore.getState().systemStatus.openclaw.installed).toBe(true)
      expect(useAppStore.getState().systemStatus.openclaw.version).toBe('1.0.0')
    })
  })

  describe('Install Steps', () => {
    it('应该更新步骤状态', () => {
      const store = useAppStore.getState()
      store.updateStepStatus('install-node', 'running')
      
      const step = useAppStore.getState().installSteps.find(s => s.id === 'install-node')
      expect(step?.status).toBe('running')
    })

    it('应该更新步骤状态并添加消息', () => {
      const store = useAppStore.getState()
      store.updateStepStatus('install-node', 'success', '已安装 v22.11.0')
      
      const step = useAppStore.getState().installSteps.find(s => s.id === 'install-node')
      expect(step?.status).toBe('success')
      expect(step?.message).toBe('已安装 v22.11.0')
    })

    it('应该处理所有步骤状态', () => {
      const store = useAppStore.getState()
      const statuses = ['pending', 'running', 'success', 'error'] as const
      
      statuses.forEach(status => {
        store.updateStepStatus('check-env', status)
        const step = useAppStore.getState().installSteps.find(s => s.id === 'check-env')
        expect(step?.status).toBe(status)
      })
    })
  })

  describe('Logs', () => {
    it('应该添加带时间戳的日志', () => {
      const store = useAppStore.getState()
      store.addLog('测试日志')
      
      const logs = useAppStore.getState().logs
      expect(logs.length).toBe(1)
      expect(logs[0]).toContain('测试日志')
      expect(logs[0]).toMatch(/\[\d{1,2}:\d{2}:\d{2}\]/)
    })

    it('应该添加多条日志', () => {
      const store = useAppStore.getState()
      store.addLog('日志1')
      store.addLog('日志2')
      store.addLog('日志3')
      
      expect(useAppStore.getState().logs).toHaveLength(3)
      expect(useAppStore.getState().logs[0]).toContain('日志1')
      expect(useAppStore.getState().logs[2]).toContain('日志3')
    })

    it('应该清空日志', () => {
      const store = useAppStore.getState()
      store.addLog('日志1')
      store.addLog('日志2')
      store.clearLogs()
      
      expect(useAppStore.getState().logs).toHaveLength(0)
    })

    it('应该限制日志数量为100条', () => {
      const store = useAppStore.getState()
      
      // 添加110条日志
      for (let i = 0; i < 110; i++) {
        store.addLog(`日志${i}`)
      }
      
      expect(useAppStore.getState().logs).toHaveLength(100)
    })
  })

  describe('AI Config', () => {
    it('应该更新选中的模型', () => {
      const store = useAppStore.getState()
      store.setSelectedModel('gpt-4')
      
      expect(useAppStore.getState().selectedModel).toBe('gpt-4')
    })

    it('应该更新 API Key', () => {
      const store = useAppStore.getState()
      store.setApiKey('test-api-key-12345')
      
      expect(useAppStore.getState().apiKey).toBe('test-api-key-12345')
    })

    it('应该有默认模型', () => {
      expect(useAppStore.getState().selectedModel).toBe('doubao-seed-2.0-code')
    })
  })

  describe('Feishu Config', () => {
    it('应该更新飞书配置', () => {
      const store = useAppStore.getState()
      store.setFeishuConfig({ appId: 'test-app-id', appSecret: 'test-secret' })
      
      expect(useAppStore.getState().feishuConfig.appId).toBe('test-app-id')
      expect(useAppStore.getState().feishuConfig.appSecret).toBe('test-secret')
    })

    it('应该部分更新飞书配置', () => {
      const store = useAppStore.getState()
      store.setFeishuConfig({ appSecret: 'new-secret' })
      
      expect(useAppStore.getState().feishuConfig.appId).toBe('')
      expect(useAppStore.getState().feishuConfig.appSecret).toBe('new-secret')
    })
  })

  describe('Navigation', () => {
    it('应该更新当前导航', () => {
      const store = useAppStore.getState()
      store.setCurrentNav('ai-config')
      
      expect(useAppStore.getState().currentNav).toBe('ai-config')
    })

    it('应该支持所有导航键', () => {
      const store = useAppStore.getState()
      const navs = ['install', 'ai-config', 'channel-config', 'uninstall', 'about'] as const
      
      navs.forEach(nav => {
        store.setCurrentNav(nav)
        expect(useAppStore.getState().currentNav).toBe(nav)
      })
    })
  })
})
