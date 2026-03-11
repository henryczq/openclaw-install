export const installSteps = [
  {
    key: 'precheck',
    title: '1.1 安装前检查',
    trigger: '进入“一键安装”页面或点击“检测环境”',
    steps: [
      { action: '检测范围', detail: '页面会依次检查 VC++ 运行库、Node.js、npm、Git、OpenClaw 当前状态。' },
      { action: '状态展示', detail: '顶部环境卡片会显示检测到的版本；已满足要求的组件会在后续步骤中自动跳过。' },
      { action: '辅助操作', detail: '页面底部支持“检测环境”“初始化配置”“重置状态”等辅助按钮。' },
    ],
    logic: '如果 Git 新装后尚未进入当前进程的 PATH，应用会提示重启；OpenClaw 安装阶段会弹出独立 PowerShell 窗口。',
  },
  {
    key: 'vcredist',
    title: '1.2 VC++ 运行库',
    trigger: '检测到系统缺少 Microsoft Visual C++ 运行库时',
    steps: [
      { action: '下载来源', detail: '从微软官方地址下载 VC_redist.x64.exe。' },
      { action: '执行安装', detail: '使用静默参数安装；如果系统要求提升权限，可能会弹出 UAC 提示。' },
      { action: '失败处理', detail: '这一项失败时日志会提示手动安装链接，Node.js 安装仍可能继续尝试。' },
    ],
  },
  {
    key: 'nodejs',
    title: '1.3 Node.js 安装',
    trigger: 'Node.js 未安装或版本低于要求时',
    steps: [
      { action: '下载来源', detail: '从 npmmirror 下载 Windows x64 Node.js 安装包。' },
      { action: '安装方式', detail: '应用会以管理员方式调用 MSI 安装程序。' },
      { action: '验证结果', detail: '安装完成后会重新检测 Node.js 版本，并在步骤栏显示版本标签。' },
      { action: '手动处理', detail: '如果自动安装失败，可点击该步骤右侧的“手动下载”。' },
    ],
    logic: '当前要求 Node.js >= 22。',
  },
  {
    key: 'git',
    title: '1.4 Git 安装与兼容配置',
    trigger: 'Git 未安装或版本过低时',
    steps: [
      { action: '下载来源', detail: '从 Git for Windows 镜像下载安装包。' },
      { action: '安装方式', detail: '使用静默模式安装 Git 64 位版本。' },
      { action: '兼容处理', detail: '如果启用了 GitHub 兼容配置，应用会写入 Git 配置，将常见 GitHub SSH 地址改写为 HTTPS，并设置 HTTP/1.1。' },
      { action: '重启提示', detail: 'Git 安装完成后如当前应用仍未识别到 Git，会提示你重启应用并继续安装。' },
    ],
    logic: '当前要求 Git >= 2。',
  },
  {
    key: 'openclaw',
    title: '1.5 OpenClaw 安装',
    trigger: 'Node.js 与 Git 准备完成后',
    steps: [
      { action: '执行方式', detail: '应用会启动独立 PowerShell 窗口，方便你直接观察安装输出。' },
      { action: '安装命令', detail: '当前默认执行 npm install -g openclaw@latest。' },
      { action: '等待逻辑', detail: '主界面会每 5 秒轮询一次安装结果，最长等待约 20 分钟。' },
      { action: '失败诊断', detail: '如果安装失败，日志会给出网络、权限、Git/GitHub 访问等诊断信息，并保留手动安装入口。' },
    ],
  },
  {
    key: 'post-install',
    title: '1.6 安装完成后的下一步',
    trigger: 'OpenClaw 安装成功后',
    steps: [
      { action: '初始化配置', detail: '安装器会写入一份默认 OpenClaw 配置文件。' },
      { action: '配置 AI', detail: '前往“AI配置”页面选择提供商、填写 API Key，并先测试连接。' },
      { action: '配置渠道', detail: '前往“渠道配置”页面完成 QQ 机器人接入；飞书入口目前为开发中。' },
      { action: '管理服务', detail: '如需启动、停止或重启网关，请前往“设置 > 服务管理”。' },
    ],
  },
];

export const aiConfigSteps = [
  {
    key: 'providers',
    title: '2.1 支持的配置页签',
    models: [
      { name: '火山引擎', provider: 'Volcengine Ark', endpoint: 'https://ark.cn-beijing.volces.com/api/coding/v3' },
      { name: 'KIMI', provider: 'Moonshot', endpoint: 'https://api.moonshot.cn/v1' },
      { name: '自定义', provider: '兼容 OpenAI 的服务', endpoint: '任意兼容 OpenAI Chat Completions 的基础 URL' },
    ],
  },
  {
    key: 'key-flow',
    title: '2.2 API Key 获取与回填',
    auto: [
      '火山引擎页签提供“去火山引擎创建”和“去火山引擎获取”两个入口，可自动打开控制台并在成功后回填 API Key。',
      'KIMI 页签支持打开控制台并在获取成功后回填 KIMI API Key。',
      '如果自动获取失败，也可以手动复制 API Key 后再粘贴到输入框。',
    ],
    manual: [
      '火山引擎和 KIMI 都支持先保存 API Key，再点击“测试连接”确认配置是否可用。',
      '自定义页签需要同时填写 Provider、API URL、模型 ID 和 API Key。',
    ],
  },
  {
    key: 'save-test',
    title: '2.3 保存与测试',
    manual: [
      '建议先点击“测试连接”，确认当前模型和 API Key 可用后再保存。',
      '保存配置会更新 OpenClaw 的 AI provider 和默认模型设置。',
      '页面顶部会提示该操作可能覆盖现有 AI 相关配置，重要配置建议先备份。',
    ],
  },
];

export const channelSteps = [
  {
    key: 'channel-status',
    title: '3.1 页面现状',
    trigger: '进入“渠道配置”页面后',
    phases: [
      { name: 'QQ 配置', detail: '当前主流程已可用，支持插件检测、安装、一键配置、凭证回填和绑定。' },
      { name: '飞书配置', detail: '当前已拆分为独立页面，但功能仍显示“开发未完成，敬请期待”，且操作已禁用。' },
    ],
  },
  {
    key: 'qq-flow',
    title: '3.2 QQ 配置流程',
    trigger: '在 QQ 配置页手动逐步执行，或点击“一键配置”',
    phases: [
      { name: '检查插件', detail: '先检查系统中是否已安装 QQ Bot 插件，已安装会自动跳过安装步骤。' },
      { name: '安装插件', detail: '缺少插件时自动执行安装，并在日志区域显示过程输出。' },
      { name: '登录控制台', detail: '打开内置浏览器进入 QQ Bot 管理页面；若检测到已登录，会直接尝试进入下一步。' },
      { name: '创建与取证', detail: '支持自动创建机器人、获取 AppID / AppSecret，并回填到变量面板。' },
      { name: '绑定与重启', detail: '将凭证绑定到 OpenClaw 渠道配置后，重启网关使 QQ 渠道生效。' },
    ],
  },
  {
    key: 'qq-commands',
    title: '3.3 关键命令',
    trigger: 'QQ 配置过程会在后台调用这些命令',
    commands: [
      { cmd: 'openclaw plugins list', desc: '检查当前插件列表，确认 QQ 插件状态。' },
      { cmd: 'openclaw plugins install @tencent-connect/openclaw-qqbot@latest', desc: '安装 QQ Bot 插件。' },
      { cmd: 'openclaw channels add --channel qqbot --token "appId:appSecret"', desc: '绑定 QQ 机器人到 OpenClaw。' },
      { cmd: 'openclaw gateway restart', desc: '重启网关，让新的渠道配置生效。' },
    ],
  },
];

export const settingsItems = [
  { setting: '模型设置', default: '模型与 Provider 管理', desc: '管理 OpenClaw 中的模型、Provider、默认模型，以及自定义模型项。' },
  { setting: '服务管理', default: '网关端口 18789', desc: '查看 OpenClaw 版本与网关状态，支持启动、停止、重启和打开本地 Web 界面。' },
  { setting: '查看配置', default: '当前配置文件内容', desc: '查看、编辑、保存 OpenClaw 配置，并支持刷新内容和恢复备份。' },
  { setting: 'Node.js 下载配置', default: '可自定义下载地址', desc: '控制一键安装时使用的 Node.js 下载链接与相关参数。' },
  { setting: 'Git 下载配置', default: '可自定义镜像与版本来源', desc: '控制一键安装时的 Git 下载地址，便于切换镜像源。' },
  { setting: 'OpenClaw 下载配置', default: '可自定义安装来源与配置路径', desc: '可调整 OpenClaw 安装入口，并单独设置 OpenClaw 配置文件路径。' },
];

export const uninstallSteps = [
  { step: '卸载主程序', command: '页面按钮：卸载 OpenClaw', desc: '调用 npm uninstall -g openclaw 卸载主程序。' },
  { step: '重新检测残余', command: '页面按钮：重新检测残余', desc: '扫描 npm 全局命令、全局包目录、本地 wrapper、用户目录副本与配置目录。' },
  { step: '清理安装残余', command: '页面按钮：清理安装残余', desc: '先尝试执行卸载，再批量删除检测到的残余文件和目录。' },
  { step: '逐项手动删除', command: '残余列表右侧：删除', desc: '当你只想删除某一个命令入口或目录时，可逐项确认并删除。' },
];

export const anchorItems = [
  { key: 'install', href: '#install', title: '一键安装' },
  { key: 'ai-config', href: '#ai-config', title: 'AI配置' },
  { key: 'channel-config', href: '#channel-config', title: '渠道配置' },
  { key: 'settings', href: '#settings', title: '设置' },
  { key: 'uninstall', href: '#uninstall', title: '卸载清理' },
];
