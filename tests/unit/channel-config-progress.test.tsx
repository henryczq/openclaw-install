import { act, render, screen, waitFor } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChannelConfigPage from '../../src/pages/ChannelConfigPage'
import { useAppStore } from '../../src/store'

describe('ChannelConfigPage progress bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAppStore.setState({
      currentNav: 'channel-config',
      logs: [],
      feishuConfig: {
        appName: 'openclaw',
        appDesc: '',
        appId: '',
        appSecret: '',
      },
    })
  })

  it('registers install progress handlers through electronAPI', async () => {
    let installProgressHandler: ((output: string) => void) | null = null

    window.electronAPI.setFeishuInstallProgressHandler.mockImplementation((handler) => {
      installProgressHandler = handler
    })

    render(
      <AntdApp>
        <ChannelConfigPage />
      </AntdApp>
    )

    await waitFor(() => {
      expect(window.electronAPI.setFeishuInstallProgressHandler).toHaveBeenCalled()
      expect(window.electronAPI.setFeishuRpaProgressHandler).toHaveBeenCalled()
    })

    act(() => {
      installProgressHandler?.('progress line')
    })

    expect(await screen.findByText('progress line')).toBeInTheDocument()
  })
})
