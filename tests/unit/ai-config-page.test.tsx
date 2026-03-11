import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AIConfigPage from '../../src/pages/AIConfigPage'
import { useAppStore } from '../../src/store'

describe('AIConfigPage custom provider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAppStore.setState({
      selectedModel: 'doubao-seed-2.0-code',
      apiKey: '',
    })

    window.electronAPI.readOpenClawConfig.mockResolvedValue({ success: false })
    window.electronAPI.configOpenClawAI.mockResolvedValue({ success: true })
    window.electronAPI.testAIConnection.mockResolvedValue({ success: true })
  })

  it('loads custom config from file', async () => {
    window.electronAPI.readOpenClawConfig.mockResolvedValue({
      success: true,
      config: {
        models: {
          providers: {
            custom: {
              baseUrl: 'https://api.example.com/v1',
              apiKey: 'sk-loaded',
            },
          },
        },
        agents: {
          defaults: {
            model: {
              primary: 'custom:gpt-4.1-mini',
            },
          },
        },
      },
    })

    const { container } = render(
      <AntdApp>
        <AIConfigPage />
      </AntdApp>
    )

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '自定义' })).toHaveAttribute('aria-selected', 'true')
    })

    const activePane = container.querySelector('.ant-tabs-tabpane-active')
    expect(activePane).not.toBeNull()

    const scope = within(activePane as HTMLElement)
    expect(scope.getByDisplayValue('https://api.example.com/v1')).toBeInTheDocument()
    expect(scope.getByDisplayValue('gpt-4.1-mini')).toBeInTheDocument()
    expect(scope.getByDisplayValue('sk-loaded')).toBeInTheDocument()
  })

  it('saves and tests custom provider config', async () => {
    const { container } = render(
      <AntdApp>
        <AIConfigPage />
      </AntdApp>
    )

    fireEvent.click(screen.getByRole('tab', { name: '自定义' }))

    const activePane = await waitFor(() => {
      const pane = container.querySelector('.ant-tabs-tabpane-active')
      expect(pane).not.toBeNull()
      return pane as HTMLElement
    })

    const scope = within(activePane)

    fireEvent.change(
      scope.getByPlaceholderText('请输入兼容 OpenAI 的 API URL，例如 https://api.example.com/v1'),
      { target: { value: 'https://api.example.com/v1/' } }
    )
    fireEvent.change(
      scope.getByPlaceholderText('请输入模型 ID，例如 gpt-4.1-mini'),
      { target: { value: 'gpt-4.1-mini' } }
    )
    fireEvent.change(
      scope.getByPlaceholderText('请输入自定义服务的 API Key'),
      { target: { value: 'sk-test' } }
    )

    fireEvent.click(scope.getByRole('button', { name: /保存配置/ }))

    await waitFor(() => {
      expect(window.electronAPI.configOpenClawAI).toHaveBeenCalledWith({
        provider: 'custom',
        baseUrl: 'https://api.example.com/v1/',
        apiKey: 'sk-test',
        modelId: 'gpt-4.1-mini',
        modelName: 'gpt-4.1-mini',
      }, '')
    })

    fireEvent.click(scope.getByRole('button', { name: /测试连接/ }))

    await waitFor(() => {
      expect(window.electronAPI.testAIConnection).toHaveBeenCalledWith({
        provider: 'custom',
        model: 'gpt-4.1-mini',
        apiKey: 'sk-test',
        baseUrl: 'https://api.example.com/v1/',
      })
    })
  })
})
