import fs from 'fs'
import path from 'path'

interface TestResult {
  name: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error?: string
}

interface TestSuite {
  name: string
  tests: TestResult[]
  passed: number
  failed: number
  skipped: number
  duration: number
}

interface TestReport {
  timestamp: string
  totalTests: number
  passed: number
  failed: number
  skipped: number
  duration: number
  suites: TestSuite[]
}

export class ReportGenerator {
  private report: TestReport

  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      suites: []
    }
  }

  addSuite(suite: TestSuite) {
    this.report.suites.push(suite)
    this.report.totalTests += suite.tests.length
    this.report.passed += suite.passed
    this.report.failed += suite.failed
    this.report.skipped += suite.skipped
    this.report.duration += suite.duration
  }

  generateHTML(): string {
    const passRate = this.report.totalTests > 0 
      ? ((this.report.passed / this.report.totalTests) * 100).toFixed(2)
      : '0.00'

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenClaw 安装助手 - 测试报告</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header .timestamp {
      opacity: 0.9;
      font-size: 14px;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    
    .summary-card .number {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .summary-card .label {
      color: #666;
      font-size: 14px;
    }
    
    .summary-card.passed .number { color: #52c41a; }
    .summary-card.failed .number { color: #ff4d4f; }
    .summary-card.skipped .number { color: #faad14; }
    .summary-card.total .number { color: #1890ff; }
    .summary-card.duration .number { color: #722ed1; }
    
    .progress-bar {
      background: white;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .progress-bar h3 {
      margin-bottom: 15px;
      color: #333;
    }
    
    .progress {
      height: 30px;
      background: #f0f0f0;
      border-radius: 15px;
      overflow: hidden;
      display: flex;
    }
    
    .progress-segment {
      height: 100%;
      transition: width 0.3s ease;
    }
    
    .progress-segment.passed { background: #52c41a; }
    .progress-segment.failed { background: #ff4d4f; }
    .progress-segment.skipped { background: #faad14; }
    
    .progress-legend {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 15px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 14px;
    }
    
    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }
    
    .suites {
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .suite {
      border-bottom: 1px solid #f0f0f0;
    }
    
    .suite:last-child {
      border-bottom: none;
    }
    
    .suite-header {
      padding: 15px 20px;
      background: #fafafa;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.2s;
    }
    
    .suite-header:hover {
      background: #f0f0f0;
    }
    
    .suite-name {
      font-weight: 600;
      color: #333;
    }
    
    .suite-stats {
      display: flex;
      gap: 15px;
      font-size: 14px;
    }
    
    .suite-stat {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
    }
    
    .suite-stat.passed { background: #f6ffed; color: #52c41a; }
    .suite-stat.failed { background: #fff2f0; color: #ff4d4f; }
    .suite-stat.skipped { background: #fffbe6; color: #faad14; }
    
    .tests {
      display: none;
    }
    
    .suite.expanded .tests {
      display: block;
    }
    
    .test {
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f5f5f5;
    }
    
    .test:last-child {
      border-bottom: none;
    }
    
    .test-name {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .status-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
    }
    
    .status-icon.passed { background: #52c41a; }
    .status-icon.failed { background: #ff4d4f; }
    .status-icon.skipped { background: #faad14; }
    
    .test-duration {
      color: #999;
      font-size: 12px;
    }
    
    .test-error {
      margin-top: 8px;
      padding: 10px;
      background: #fff2f0;
      border: 1px solid #ffccc7;
      border-radius: 4px;
      color: #ff4d4f;
      font-size: 12px;
      font-family: monospace;
      white-space: pre-wrap;
    }
    
    .footer {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 OpenClaw 安装助手 - 测试报告</h1>
      <div class="timestamp">生成时间: ${new Date(this.report.timestamp).toLocaleString('zh-CN')}</div>
    </div>
    
    <div class="summary">
      <div class="summary-card total">
        <div class="number">${this.report.totalTests}</div>
        <div class="label">总测试数</div>
      </div>
      <div class="summary-card passed">
        <div class="number">${this.report.passed}</div>
        <div class="label">通过</div>
      </div>
      <div class="summary-card failed">
        <div class="number">${this.report.failed}</div>
        <div class="label">失败</div>
      </div>
      <div class="summary-card skipped">
        <div class="number">${this.report.skipped}</div>
        <div class="label">跳过</div>
      </div>
      <div class="summary-card duration">
        <div class="number">${(this.report.duration / 1000).toFixed(2)}s</div>
        <div class="label">总耗时</div>
      </div>
    </div>
    
    <div class="progress-bar">
      <h3>测试通过率: ${passRate}%</h3>
      <div class="progress">
        <div class="progress-segment passed" style="width: ${(this.report.passed / this.report.totalTests * 100) || 0}%"></div>
        <div class="progress-segment failed" style="width: ${(this.report.failed / this.report.totalTests * 100) || 0}%"></div>
        <div class="progress-segment skipped" style="width: ${(this.report.skipped / this.report.totalTests * 100) || 0}%"></div>
      </div>
      <div class="progress-legend">
        <div class="legend-item">
          <div class="legend-color" style="background: #52c41a;"></div>
          <span>通过 (${this.report.passed})</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #ff4d4f;"></div>
          <span>失败 (${this.report.failed})</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #faad14;"></div>
          <span>跳过 (${this.report.skipped})</span>
        </div>
      </div>
    </div>
    
    <div class="suites">
      ${this.report.suites.map((suite, index) => `
        <div class="suite" id="suite-${index}">
          <div class="suite-header" onclick="toggleSuite(${index})">
            <span class="suite-name">${suite.name}</span>
            <div class="suite-stats">
              <span class="suite-stat passed">${suite.passed} 通过</span>
              ${suite.failed > 0 ? `<span class="suite-stat failed">${suite.failed} 失败</span>` : ''}
              ${suite.skipped > 0 ? `<span class="suite-stat skipped">${suite.skipped} 跳过</span>` : ''}
              <span style="color: #999; font-size: 12px;">${(suite.duration / 1000).toFixed(2)}s</span>
            </div>
          </div>
          <div class="tests">
            ${suite.tests.map(test => `
              <div class="test">
                <div class="test-name">
                  <span class="status-icon ${test.status}">${test.status === 'passed' ? '✓' : test.status === 'failed' ? '✗' : '○'}</span>
                  <span>${test.name}</span>
                </div>
                <span class="test-duration">${test.duration}ms</span>
              </div>
              ${test.error ? `<div class="test-error">${test.error}</div>` : ''}
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="footer">
      OpenClaw 安装助手测试报告 © ${new Date().getFullYear()}
    </div>
  </div>
  
  <script>
    function toggleSuite(index) {
      const suite = document.getElementById('suite-' + index);
      suite.classList.toggle('expanded');
    }
  </script>
</body>
</html>`
  }

  saveReport(outputPath: string) {
    const html = this.generateHTML()
    fs.writeFileSync(outputPath, html, 'utf-8')
    console.log(`📊 测试报告已生成: ${outputPath}`)
  }
}

// 如果直接运行此文件
const isMainModule = import.meta.url === `file://${process.argv[1]}`

if (isMainModule) {
  // 示例：生成示例报告
  const generator = new ReportGenerator()
  
  generator.addSuite({
    name: 'Store 单元测试',
    tests: [
      { name: '应该更新 node 状态', status: 'passed', duration: 15 },
      { name: '应该更新 git 状态', status: 'passed', duration: 12 },
      { name: '应该更新 npm 状态', status: 'passed', duration: 10 },
      { name: '应该添加日志', status: 'passed', duration: 8 },
    ],
    passed: 4,
    failed: 0,
    skipped: 0,
    duration: 45
  })
  
  generator.addSuite({
    name: 'IPC 集成测试',
    tests: [
      { name: '应该检查 Node.js 安装', status: 'passed', duration: 120 },
      { name: '应该检查 Git 安装', status: 'passed', duration: 110 },
      { name: '应该下载文件', status: 'passed', duration: 2500 },
      { name: '应该执行命令', status: 'failed', duration: 500, error: 'Command not found: invalid-cmd' },
    ],
    passed: 3,
    failed: 1,
    skipped: 0,
    duration: 3230
  })
  
  const reportDir = path.join(__dirname, '../reports')
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }
  
  generator.saveReport(path.join(reportDir, 'test-report.html'))
}
