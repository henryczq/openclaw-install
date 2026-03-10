# 🧪 OpenClaw 安装助手 - 测试文档

## 测试架构概览

本项目采用三层测试架构：

```
┌─────────────────────────────────────────────────────────┐
│  E2E 测试 (End-to-End)                                  │
│  - 使用 Playwright 进行端到端测试                        │
│  - 测试完整的用户流程                                    │
│  - 验证界面交互和功能集成                                │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  集成测试 (Integration)                                  │
│  - 测试 IPC 通信                                          │
│  - 验证主进程和渲染进程交互                              │
│  - 测试 API 接口                                          │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  单元测试 (Unit)                                         │
│  - 使用 Vitest 进行单元测试                              │
│  - 测试 Store 状态管理                                    │
│  - 测试工具函数                                          │
└─────────────────────────────────────────────────────────┘
```

## 测试文件结构

```
tests/
├── README.md                 # 测试文档
├── setup.ts                  # 测试环境配置
├── run-tests.ts              # 一键测试启动器
├── unit/                     # 单元测试
│   └── store.test.ts         # Store 状态管理测试
├── integration/              # 集成测试
│   └── ipc.test.ts           # IPC 通信测试
├── e2e/                      # E2E 测试
│   └── install-flow.test.ts  # 安装流程测试
├── utils/                    # 测试工具
│   └── report-generator.ts   # 报告生成器
├── reports/                  # 测试报告输出
└── coverage/                 # 覆盖率报告
```

## 快速开始

### 一键运行所有测试

```bash
npm test
```

### 运行特定类型的测试

```bash
# 只运行单元测试
npm test -- --unit

# 只运行集成测试
npm test -- --integration

# 只运行 E2E 测试
npm test -- --e2e
```

### 生成测试报告

```bash
# 运行测试并生成 HTML 报告
npm test -- --report

# 生成覆盖率报告
npm test -- --coverage

# 运行所有测试并生成完整报告
npm run test:all
```

### 监视模式

```bash
# 监视模式（文件变化自动重新运行）
npm test -- --watch

# 或
npm run test:watch
```

## 测试命令速查表

| 命令 | 说明 |
|------|------|
| `npm test` | 运行所有测试 |
| `npm run test:unit` | 运行单元测试 |
| `npm run test:integration` | 运行集成测试 |
| `npm run test:e2e` | 运行 E2E 测试 |
| `npm run test:coverage` | 生成覆盖率报告 |
| `npm run test:watch` | 监视模式 |
| `npm run test:report` | 生成 HTML 报告 |
| `npm run test:all` | 运行所有测试并生成报告 |

## 测试用例详情

### 单元测试 (Unit Tests)

**文件**: `tests/unit/store.test.ts`

测试内容：
- ✅ System Status 更新（Node.js、Git、npm、OpenClaw）
- ✅ Install Steps 状态管理
- ✅ Logs 日志系统
- ✅ AI Config 配置
- ✅ Channel Config 配置

**运行**: `npm run test:unit`

### 集成测试 (Integration Tests)

**文件**: `tests/integration/ipc.test.ts`

测试内容：
- ✅ 环境检查（checkNode、checkNpm、checkGit、checkOpenClaw）
- ✅ 配置管理（setNpmRegistry、configGitProxy）
- ✅ 文件操作（downloadFile、downloadFileWithProgress）
- ✅ 系统操作（openExternal、getSystemInfo、showMessageBox）
- ✅ 命令执行（executeCommand）
- ✅ OpenClaw 操作（install、onboard、config、restart、uninstall）

**运行**: `npm run test:integration`

### E2E 测试 (End-to-End Tests)

**文件**: `tests/e2e/install-flow.test.ts`

测试内容：
- ✅ 应用启动
- ✅ 环境检测步骤显示
- ✅ 模拟模式开关
- ✅ 开始安装按钮
- ✅ 重新检测环境按钮
- ✅ 环境状态标签
- ✅ 日志区域
- ✅ 页面导航（AI配置、渠道配置、关于）

**运行**: `npm run test:e2e`

## 测试报告

### HTML 报告

运行 `npm test -- --report` 后会生成 HTML 格式的测试报告：

```
tests/reports/
├── test-report.html          # 综合测试报告
├── vitest-report.html        # Vitest 详细报告
├── playwright-report/        # Playwright 报告
└── coverage/                 # 覆盖率报告
    └── index.html
```

### 报告内容

- 📊 测试通过率统计
- 📈 进度条可视化
- 📝 详细的测试用例列表
- ⏱️ 执行时间统计
- ❌ 错误信息和堆栈跟踪

## 编写新测试

### 单元测试示例

```typescript
import { describe, it, expect } from 'vitest'
import { useAppStore } from '../../src/store'

describe('新功能测试', () => {
  it('应该正确执行某个功能', () => {
    const store = useAppStore.getState()
    
    // 执行操作
    store.someAction()
    
    // 验证结果
    expect(store.someState).toBe('expected-value')
  })
})
```

### 集成测试示例

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('IPC 测试', () => {
  it('应该正确调用 IPC 方法', async () => {
    const mockResult = { success: true }
    window.electronAPI.someMethod.mockResolvedValue(mockResult)

    const result = await window.electronAPI.someMethod()

    expect(result.success).toBe(true)
  })
})
```

### E2E 测试示例

```typescript
import { test, expect } from '@playwright/test'

test('应该完成某个用户流程', async ({ page }) => {
  // 打开应用
  await page.goto('app://index.html')
  
  // 执行操作
  await page.click('button:has-text("开始")')
  
  // 验证结果
  await expect(page.locator('.success-message')).toBeVisible()
})
```

## 最佳实践

### 1. 测试命名

- 使用描述性的测试名称
- 遵循 `应该...` 的命名规范
- 示例：`应该正确更新 Node.js 状态`

### 2. 测试独立性

- 每个测试应该独立运行
- 使用 `beforeEach` 重置状态
- 避免测试之间的依赖

### 3. Mock 数据

- 使用 mock 数据隔离外部依赖
- 在 `tests/setup.ts` 中配置全局 mock
- 使用 `vi.fn()` 创建 mock 函数

### 4. 断言

- 使用明确的断言
- 一个测试只验证一个概念
- 使用 `expect().toBe()` 而不是 `expect().toEqual()` 进行精确匹配

## 故障排除

### 测试失败

1. 检查测试环境配置
2. 确认 mock 数据正确
3. 查看详细的错误信息
4. 使用 `--watch` 模式调试

### E2E 测试问题

1. 确保应用已构建：`npm run build`
2. 检查 Electron 路径配置
3. 查看 Playwright 调试输出

### 覆盖率问题

1. 确保安装了 `@vitest/coverage-v8`
2. 检查 `vitest.config.ts` 配置
3. 查看 `tests/coverage/index.html`

## 持续集成

在 CI/CD 中运行测试：

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:all
```

## 贡献指南

1. 为新功能编写对应的测试
2. 确保所有测试通过
3. 保持测试代码的简洁和可读性
4. 更新测试文档

## 参考资源

- [Vitest 文档](https://vitest.dev/)
- [Playwright 文档](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
