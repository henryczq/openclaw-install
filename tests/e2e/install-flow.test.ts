import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'

let electronApp: Awaited<ReturnType<typeof electron.launch>>

test.beforeAll(async () => {
  electronApp = await electron.launch({
    args: [path.join(__dirname, '../../electron/main.js')],
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  })
})

test.afterAll(async () => {
  await electronApp.close()
})

test.describe('安装流程 E2E 测试', () => {
  test('应用应该正确启动', async () => {
    const window = await electronApp.firstWindow()
    const title = await window.title()
    expect(title).toContain('OpenClaw')
  })

  test('应该显示环境检测步骤', async () => {
    const window = await electronApp.firstWindow()
    
    // 等待页面加载
    await window.waitForSelector('.ant-steps')
    
    // 检查步骤是否存在
    const steps = await window.locator('.ant-steps-item').count()
    expect(steps).toBeGreaterThan(0)
    
    // 检查环境检测步骤
    const checkEnvStep = await window.locator('text=环境检测').isVisible()
    expect(checkEnvStep).toBe(true)
  })

  test('应该显示模拟模式开关', async () => {
    const window = await electronApp.firstWindow()
    
    // 检查模拟模式开关
    const mockSwitch = await window.locator('.ant-switch').first()
    expect(await mockSwitch.isVisible()).toBe(true)
  })

  test('应该能切换模拟模式', async () => {
    const window = await electronApp.firstWindow()
    
    // 找到模拟模式开关并点击
    const mockSwitch = window.locator('.ant-switch').first()
    await mockSwitch.click()
    
    // 检查警告提示是否出现
    const alert = await window.locator('.ant-alert-warning').isVisible()
    expect(alert).toBe(true)
  })

  test('应该显示开始安装按钮', async () => {
    const window = await electronApp.firstWindow()
    
    // 检查开始安装按钮
    const installButton = await window.locator('button:has-text("开始一键安装")').isVisible()
    expect(installButton).toBe(true)
  })

  test('应该显示重新检测环境按钮', async () => {
    const window = await electronApp.firstWindow()
    
    // 检查重新检测按钮
    const checkButton = await window.locator('button:has-text("重新检测环境")').isVisible()
    expect(checkButton).toBe(true)
  })

  test('应该显示环境状态标签', async () => {
    const window = await electronApp.firstWindow()
    
    // 检查环境状态标签
    const nodeTag = await window.locator('text=Node.js').first().isVisible()
    const npmTag = await window.locator('text=npm').first().isVisible()
    const gitTag = await window.locator('text=Git').first().isVisible()
    const openclawTag = await window.locator('text=OpenClaw').first().isVisible()
    
    expect(nodeTag).toBe(true)
    expect(npmTag).toBe(true)
    expect(gitTag).toBe(true)
    expect(openclawTag).toBe(true)
  })

  test('应该显示日志区域', async () => {
    const window = await electronApp.firstWindow()
    
    // 检查日志卡片
    const logCard = await window.locator('.ant-card:has-text("安装日志")').isVisible()
    expect(logCard).toBe(true)
  })

  test('点击重新检测应该更新日志', async () => {
    const window = await electronApp.firstWindow()
    
    // 点击重新检测按钮
    await window.click('button:has-text("重新检测环境")')
    
    // 等待日志更新
    await window.waitForTimeout(1000)
    
    // 检查日志区域是否有内容
    const logContent = await window.locator('.ant-card:has-text("安装日志") .ant-card-body').innerText()
    expect(logContent.length).toBeGreaterThan(0)
  })

  test('应该能导航到AI配置页面', async () => {
    const window = await electronApp.firstWindow()
    
    // 点击AI配置菜单
    await window.click('text=AI配置')
    
    // 等待页面切换
    await window.waitForTimeout(500)
    
    // 检查AI配置页面内容
    const aiConfigTitle = await window.locator('text=AI模型配置').isVisible()
    expect(aiConfigTitle).toBe(true)
  })

  test('应该能导航到渠道配置页面', async () => {
    const window = await electronApp.firstWindow()
    
    // 点击渠道配置菜单
    await window.click('text=渠道配置')
    
    // 等待页面切换
    await window.waitForTimeout(500)
    
    // 检查渠道配置页面内容
    const channelConfigTitle = await window.locator('text=渠道配置').isVisible()
    expect(channelConfigTitle).toBe(true)
  })

  test('应该能导航到关于页面', async () => {
    const window = await electronApp.firstWindow()
    
    // 点击关于菜单
    await window.click('text=关于')
    
    // 等待页面切换
    await window.waitForTimeout(500)
    
    // 检查关于页面内容
    const aboutTitle = await window.locator('text=关于 OpenClaw安装助手').isVisible()
    expect(aboutTitle).toBe(true)
  })
})

test.describe('安装页面交互测试', () => {
  test('模拟模式警告应该在开启时显示', async () => {
    const window = await electronApp.firstWindow()
    
    // 确保在首页
    await window.click('text=一键安装')
    await window.waitForTimeout(300)
    
    // 检查警告提示
    const warningAlert = await window.locator('.ant-alert-warning:has-text("模拟模式")').isVisible()
    expect(warningAlert).toBe(true)
  })

  test('重置状态按钮应该可用', async () => {
    const window = await electronApp.firstWindow()
    
    // 检查重置按钮
    const resetButton = await window.locator('button:has-text("重置状态")').isVisible()
    expect(resetButton).toBe(true)
  })

  test('步骤应该有正确的状态图标', async () => {
    const window = await electronApp.firstWindow()
    
    // 检查步骤图标
    const stepIcons = await window.locator('.ant-steps-item-icon').count()
    expect(stepIcons).toBeGreaterThan(0)
  })
})
