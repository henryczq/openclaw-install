#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface TestOptions {
  unit: boolean
  integration: boolean
  e2e: boolean
  coverage: boolean
  report: boolean
  watch: boolean
}

function parseArgs(): TestOptions {
  const args = process.argv.slice(2)
  
  // 如果没有指定任何测试类型，默认运行所有
  const hasSpecificType = args.some(arg => 
    arg === '--unit' || arg === '--integration' || arg === '--e2e'
  )
  
  return {
    unit: args.includes('--unit') || !hasSpecificType,
    integration: args.includes('--integration') || !hasSpecificType,
    e2e: args.includes('--e2e') || !hasSpecificType,
    coverage: args.includes('--coverage'),
    report: args.includes('--report'),
    watch: args.includes('--watch'),
  }
}

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const colors = {
    info: '\x1b[36m',    // 青色
    success: '\x1b[32m', // 绿色
    error: '\x1b[31m',   // 红色
    warning: '\x1b[33m', // 黄色
  }
  const reset = '\x1b[0m'
  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
  }
  console.log(`${colors[type]}${icons[type]} ${message}${reset}`)
}

function runCommand(command: string, description: string): boolean {
  log(description, 'info')
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })
    return true
  } catch (error) {
    log(`执行失败: ${command}`, 'error')
    return false
  }
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

async function runTests() {
  const options = parseArgs()
  const startTime = Date.now()
  
  console.log('\n')
  log('🚀 OpenClaw 安装助手 - 测试启动器', 'info')
  console.log('=' .repeat(60))
  
  // 显示测试配置
  log('测试配置:', 'info')
  log(`  单元测试: ${options.unit ? '✓' : '✗'}`, 'info')
  log(`  集成测试: ${options.integration ? '✓' : '✗'}`, 'info')
  log(`  E2E测试: ${options.e2e ? '✓' : '✗'}`, 'info')
  log(`  覆盖率: ${options.coverage ? '✓' : '✗'}`, 'info')
  log(`  生成报告: ${options.report ? '✓' : '✗'}`, 'info')
  log(`  监视模式: ${options.watch ? '✓' : '✗'}`, 'info')
  console.log('\n')
  
  // 确保报告目录存在
  ensureDir(path.join(__dirname, 'reports'))
  ensureDir(path.join(__dirname, 'coverage'))
  
  let allPassed = true
  
  // 运行单元测试
  if (options.unit) {
    console.log('\n')
    log('📦 运行单元测试...', 'info')
    console.log('-'.repeat(60))
    
    const unitTestCmd = options.watch 
      ? 'npx vitest --watch'
      : `npx vitest run ${options.coverage ? '--coverage' : ''}`
    
    if (!runCommand(unitTestCmd, '执行单元测试')) {
      allPassed = false
    }
  }
  
  // 运行集成测试
  if (options.integration && !options.watch) {
    console.log('\n')
    log('🔗 运行集成测试...', 'info')
    console.log('-'.repeat(60))
    
    const integrationCmd = `npx vitest run tests/integration ${options.coverage ? '--coverage' : ''}`
    
    if (!runCommand(integrationCmd, '执行集成测试')) {
      allPassed = false
    }
  }
  
  // 运行 E2E 测试
  if (options.e2e && !options.watch) {
    console.log('\n')
    log('🎭 运行 E2E 测试...', 'info')
    console.log('-'.repeat(60))
    
    // 先构建应用
    log('构建应用...', 'info')
    if (!runCommand('npm run build', '构建应用')) {
      log('构建失败，跳过 E2E 测试', 'error')
      allPassed = false
    } else {
      // 运行 Playwright 测试
      const e2eCmd = 'npx playwright test'
      if (!runCommand(e2eCmd, '执行 E2E 测试')) {
        allPassed = false
      }
    }
  }
  
  // 生成测试报告
  if (options.report && !options.watch) {
    console.log('\n')
    log('📊 生成测试报告...', 'info')
    console.log('-'.repeat(60))
    
    // 生成示例报告（实际使用时可以从测试结果解析）
    const reportGeneratorPath = path.join(__dirname, 'utils', 'report-generator.ts')
    if (fs.existsSync(reportGeneratorPath)) {
      try {
        execSync(`npx tsx ${reportGeneratorPath}`, { 
          stdio: 'inherit',
          cwd: path.join(__dirname, '..')
        })
        log('测试报告已生成', 'success')
      } catch (error) {
        log('生成报告失败', 'error')
      }
    }
  }
  
  // 显示测试结果摘要
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log('\n')
  console.log('='.repeat(60))
  
  if (allPassed) {
    log(`✨ 所有测试通过！耗时: ${duration}s`, 'success')
  } else {
    log(`⚠️ 部分测试失败，耗时: ${duration}s`, 'warning')
    process.exit(1)
  }
  
  console.log('\n')
  
  // 显示报告位置
  if (options.report) {
    log('📄 测试报告位置:', 'info')
    log(`  HTML报告: tests/reports/test-report.html`, 'info')
    log(`  覆盖率报告: tests/coverage/index.html`, 'info')
  }
  
  console.log('\n')
}

// 显示帮助信息
function showHelp() {
  console.log(`
🧪 OpenClaw 安装助手 - 测试启动器

用法: npm test [选项]

选项:
  --unit          只运行单元测试
  --integration   只运行集成测试
  --e2e           只运行 E2E 测试
  --coverage      生成覆盖率报告
  --report        生成 HTML 测试报告
  --watch         监视模式（自动重新运行测试）
  --help          显示帮助信息

示例:
  npm test                    # 运行所有测试
  npm test -- --unit          # 只运行单元测试
  npm test -- --e2e --report  # 运行 E2E 测试并生成报告
  npm test -- --watch         # 监视模式
  npm test -- --coverage      # 生成覆盖率报告
`)
}

// 主入口
if (process.argv.includes('--help')) {
  showHelp()
} else {
  runTests().catch(error => {
    log(`测试运行器出错: ${error.message}`, 'error')
    process.exit(1)
  })
}
