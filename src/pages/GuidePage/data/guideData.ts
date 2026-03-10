// 使用说明文档数据

export const installSteps = [
  {
    key: 'env-check',
    title: '1.1 环境检测',
    trigger: '点击"开始安装"按钮',
    commands: [
      { cmd: 'node -v', desc: '检测 Node.js 版本' },
      { cmd: 'npm -v', desc: '检测 NPM 版本' },
      { cmd: 'git --version', desc: '检测 Git 版本' },
      { cmd: 'openclaw --version', desc: '检测 OpenClaw 版本' },
    ],
    logic: 'Node.js < 22.0.0 或 Git < 2.40.0 时需要安装/升级',
  },
  {
    key: 'nodejs',
    title: '1.2 Node.js 安装',
    trigger: '环境检测发现 Node.js 未安装或版本过低',
    steps: [
      { action: '下载', detail: '从淘宝 npm 镜像下载 node-v24.14.0-x64.msi' },
      { action: '安装', detail: 'msiexec /i node-v24.14.0-x64.msi /quiet /norestart' },
      { action: '验证', detail: 'node -v → 预期: v24.14.0' },
      { action: '配置镜像', detail: 'npm config set registry https://registry.npmmirror.com' },
    ],
  },
  {
    key: 'git',
    title: '1.3 Git 安装',
    trigger: 'Node.js 配置完成后，检测到 Git 未安装或版本过低',
    steps: [
      { action: '下载', detail: '从南京大学镜像下载 Git-2.53.0-64-bit.exe' },
      { action: '安装', detail: 'Git-2.53.0-64-bit.exe /VERYSILENT /NORESTART' },
      { action: '验证', detail: 'git --version → 预期: git version 2.53.0.windows.1' },
      { action: '配置代理', detail: 'git config --global url."https://github.com/".insteadOf ssh://git@github.com/' },
    ],
  },
  {
    key: 'openclaw',
    title: '1.4 OpenClaw 安装',
    trigger: 'Node.js 和 Git 安装完成后',
    steps: [
      { action: '设置执行策略', detail: 'Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force' },
      { action: '执行安装脚本', detail: 'iwr -useb https://openclaw.ai/install.ps1 | iex' },
      { action: '验证安装', detail: 'openclaw --version' },
    ],
  },
  {
    key: 'init-config',
    title: '1.5 初始化配置',
    trigger: 'OpenClaw 安装完成后',
    steps: [
      { action: '创建目录', detail: 'mkdir -p ~/.openclaw/' },
      { action: '写入配置', detail: '创建 openclaw.json，包含默认 agents 配置' },
      { action: '保存路径', detail: '由 settings.json 中的 configPath 指定' },
    ],
  },
  {
    key: 'gateway',
    title: '1.6 启动网关',
    trigger: '配置初始化完成后',
    steps: [
      { action: '启动服务', detail: 'openclaw gateway start（后台进程）' },
      { action: '检测端口', detail: 'Test-NetConnection -ComputerName localhost -Port 18789' },
      { action: '成功标准', detail: 'TcpTestSucceeded = True，最多检测30次，间隔2秒' },
    ],
  },
];

export const aiConfigSteps = [
  {
    key: 'model-select',
    title: '2.1 模型选择',
    models: [
      { name: 'doubao-seed-2.0-code', provider: '字节跳动', endpoint: 'https://ark.cn-beijing.volces.com/api/coding/v3' },
      { name: 'deepseek-v3.2', provider: '深度求索', endpoint: 'https://api.deepseek.com/v1', modelId: 'deepseek-chat' },
    ],
  },
  {
    key: 'api-key',
    title: '2.2 获取 API Key',
    auto: [
      '启动 Playwright 浏览器访问火山引擎控制台',
      '等待用户登录',
      '自动抓取 API Key 并回填',
    ],
    manual: [
      '用户访问 https://console.volcengine.com/ark/region:ark+cn-beijing/apikey',
      '登录并创建/复制 API Key',
      '手动粘贴到客户端',
    ],
  },
];

export const channelSteps = [
  {
    key: 'install-plugin',
    title: '3.1 安装飞书插件',
    trigger: '点击"安装飞书插件"按钮',
    commands: [
      { cmd: 'npm install -g feishu-plugin', desc: '全局安装插件' },
      { cmd: 'openclaw plugins list', desc: '验证安装' },
    ],
  },
  {
    key: 'feishu-auto',
    title: '3.2 飞书自动化配置',
    phases: [
      { name: '登录阶段', detail: 'Playwright 访问 https://open.feishu.cn/app' },
      { name: '创建应用', detail: '自动填写应用名称和描述，创建企业自建应用' },
      { name: '获取凭证', detail: '自动读取 App ID 和 App Secret' },
      { name: '配置权限', detail: '批量导入所需权限并申请开通' },
      { name: '发布版本', detail: '自动创建并发布版本 1.0.0' },
      { name: '事件订阅', detail: '配置 im.message.receive_v1 事件' },
    ],
  },
];

export const settingsItems = [
  { setting: '配置文件路径', default: '%USERPROFILE%/.openclaw/openclaw.json', desc: 'OpenClaw 主配置文件' },
  { setting: '应用数据目录', default: '%USERPROFILE%/.openclaw/', desc: '存储插件、缓存等数据' },
  { setting: '网关端口', default: '18789', desc: 'OpenClaw 网关服务端口' },
  { setting: '日志级别', default: 'info', desc: '可选: debug, info, warn, error' },
];

export const uninstallSteps = [
  { step: '停止网关', command: 'openclaw gateway stop', desc: '停止正在运行的网关服务' },
  { step: '卸载 OpenClaw', command: 'npm uninstall -g openclaw', desc: '全局卸载 OpenClaw' },
  { step: '清理配置', command: 'rmdir /s /q %USERPROFILE%/.openclaw', desc: '删除配置和数据目录' },
  { step: '清理环境变量', command: '手动检查 PATH', desc: '移除 OpenClaw 相关路径' },
];

export const anchorItems = [
  { key: 'install', href: '#install', title: '一键安装' },
  { key: 'ai-config', href: '#ai-config', title: 'AI配置' },
  { key: 'channel-config', href: '#channel-config', title: '渠道配置' },
  { key: 'uninstall', href: '#uninstall', title: '卸载清理' },
  { key: 'settings', href: '#settings', title: '设置' },
];
