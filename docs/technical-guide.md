# OpenClaw 安装助手 - 技术操作说明

本文档详细描述安装助手各功能模块的具体操作步骤、执行的命令及其作用。

---

## 1. 一键安装

### 1.1 环境检测

**触发条件**：点击"开始安装"按钮

**执行操作**：
1. 检测 Node.js：`node -v`
2. 检测 NPM：`npm -v`
3. 检测 Git：`git --version`
4. 检测 OpenClaw：`openclaw --version`

**判断逻辑**：
- Node.js 版本 < 22.0.0 → 需要安装/升级
- Git 版本 < 2.40.0 → 需要安装/升级
- 未检测到命令 → 需要安装

---

### 1.2 Node.js 检查与安装

**触发条件**：环境检测发现 Node.js 未安装或版本过低

**业务逻辑**：
1. **下载安装包**
   - 下载源：淘宝 npm 镜像
   - URL：`https://cdn.npmmirror.com/binaries/node/v24.14.0/node-v24.14.0-x64.msi`
   - 保存路径：系统临时目录

2. **静默安装**
   - 执行：`msiexec /i node-v24.14.0-x64.msi /quiet /norestart`
   - 等待安装完成

3. **验证安装**
   - 执行：`node -v`
   - 预期输出：`v24.14.0`

4. **配置 npm 国内镜像源**
   - 执行：`npm config set registry https://registry.npmmirror.com`
   - 验证：`npm config get registry`
   - 预期输出：`https://registry.npmmirror.com`

---

### 1.3 Git 检查与安装

**触发条件**：Node.js 配置完成后，检测到 Git 未安装或版本过低

**业务逻辑**：
1. **下载安装包**
   - 下载源：南京大学镜像
   - URL：`https://mirror.nju.edu.cn/github-release/git-for-windows/git/Git%20for%20Windows%20v2.53.0.windows.1/Git-2.53.0-64-bit.exe`
   - 保存路径：系统临时目录

2. **静默安装**
   - 执行：`Git-2.53.0-64-bit.exe /VERYSILENT /NORESTART`
   - 等待安装完成

3. **验证安装**
   - 执行：`git --version`
   - 预期输出：`git version 2.53.0.windows.1`

4. **配置 Git 代理替代源**
   - 执行：`git config --global url."https://github.com/".insteadOf ssh://git@github.com/`

---

### 1.4 OpenClaw 本体安装

**触发条件**：Node.js 和 Git 安装完成后

**业务逻辑**：
1. **设置 PowerShell 执行策略**
   - 执行：`Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force`
   - 目的：允许执行远程脚本

2. **执行安装脚本**
   - 执行：`iwr -useb https://openclaw.ai/install.ps1 | iex`
   - 超时时间：300秒
   - 作用：下载并执行 OpenClaw 官方安装脚本

3. **验证安装**
   - 执行：`openclaw --version`
   - 预期输出：版本号信息

---

### 1.5 初始化配置

**触发条件**：OpenClaw 安装完成后

**业务逻辑**：
1. **创建配置目录**
   - 路径：`~/.openclaw/` (Windows: `%USERPROFILE%\.openclaw`)
   - 命令：`mkdir -p ~/.openclaw`

2. **创建配置文件**
   - 文件：`openclaw.json`
   - 内容：
     ```json
     {
       "agents": {
         "list": [
           {
             "id": "main",
             "provider": "anthropic",
             "model": "claude-3-7-sonnet-20250219"
           }
         ],
         "defaults": {
           "provider": "anthropic",
           "model": "claude-3-7-sonnet-20250219"
         }
       }
     }
     ```

3. **保存配置**
   - 调用 IPC：`saveOpenClawConfig(config)`
   - 实际写入路径由 `settings.json` 中的 `configPath` 指定

---

### 1.6 启动网关

**触发条件**：配置初始化完成后

**业务逻辑**：
1. **启动网关服务**
   - 执行：`openclaw gateway start`
   - 方式：后台进程（detached）
   - 隐藏窗口：是

2. **检测端口状态**
   - 检测端口：18789
   - 检测命令：`Test-NetConnection -ComputerName localhost -Port 18789`
   - 最大检测次数：30次
   - 检测间隔：2秒
   - 成功标志：返回 `TcpTestSucceeded: True`

---

## 2. AI 配置

### 2.1 模型选择

**支持的模型及对应配置**：

| 模型 | 提供商 | API端点 | modelId |
|------|--------|---------|---------|
| doubao-seed-2.0-code | 字节跳动 | https://ark.cn-beijing.volces.com/api/coding/v3 | - |
| doubao-seed-2.0-pro | 字节跳动 | https://ark.cn-beijing.volces.com/api/coding/v3 | - |
| doubao-seed-2.0-lite | 字节跳动 | https://ark.cn-beijing.volces.com/api/coding/v3 | - |
| doubao-seed-code | 字节跳动 | https://ark.cn-beijing.volces.com/api/coding/v3 | - |
| minimax-m2.5 | MiniMax | https://ark.cn-beijing.volces.com/api/coding/v3 | - |
| glm-4.7 | 智谱AI | https://ark.cn-beijing.volces.com/api/coding/v3 | - |
| deepseek-v3.2 | 深度求索 | https://api.deepseek.com/v1 | deepseek-chat |
| kimi-k2.5 | 月之暗面 | https://ark.cn-beijing.volces.com/api/coding/v3 | - |

---

### 2.2 获取 API Key

**方式一：自动获取**

1. **启动内置浏览器**
   - 技术：Playwright
   - 访问 URL：`https://console.volcengine.com/ark/region:ark+cn-beijing/apikey`

2. **等待用户登录**
   - 检测页面元素：API Key 展示区域
   - 抓取 Key 值

3. **回填到客户端**
   - 自动填充到输入框

**方式二：手动输入**

1. 用户访问：`https://console.volcengine.com/ark/region:ark+cn-beijing/apikey`
2. 登录并创建/复制 API Key
3. 手动粘贴到客户端输入框

---

### 2.3 保存 AI 配置

**触发条件**：点击"保存配置"按钮

**业务逻辑**：

**非 DeepSeek 模型**：
1. 调用 IPC：`configOpenClawAI(model, apiKey)`
2. 写入配置到 `openclaw.json`：
   ```json
   {
     "agents": {
       "list": [{
         "id": "main",
         "provider": "volcengine",
         "model": "{selectedModel}",
         "apiKey": "{apiKey}",
         "baseUrl": "https://ark.cn-beijing.volces.com/api/coding/v3"
       }],
       "defaults": {
         "provider": "volcengine",
         "model": "{selectedModel}"
       }
     }
   }
   ```

**DeepSeek 模型**：
1. 构造配置对象：
   ```json
   {
     "baseUrl": "https://api.deepseek.com/v1",
     "apiKey": "{apiKey}",
     "modelId": "deepseek-chat",
     "modelName": "DeepSeek Chat"
   }
   ```
2. 调用 IPC：`configOpenClawAI(configData, '')`

---

## 3. 渠道配置（飞书）

### 3.1 安装飞书插件

**触发条件**：点击"安装飞书插件"按钮

**业务逻辑**：
1. **下载插件包**
   - 命令：`curl -o "%TEMP%\feishu.tgz" <插件下载链接>`

2. **安装插件**
   - 命令：`npm install -g "%TEMP%\feishu.tgz"`

3. **验证安装**
   - 命令：`openclaw plugins list`
   - 检查输出中是否包含 feishu 插件

---

### 3.2 飞书自动化配置

**触发条件**：点击"配置飞书渠道"按钮

**业务逻辑**：

#### 阶段 1：登录
1. **启动浏览器**
   - 技术：Playwright
   - 访问 URL：`https://open.feishu.cn/app?lang=zh-CN`

2. **等待登录**
   - 检测：用户信息元素
   - 超时：5分钟

#### 阶段 2：创建应用
1. **点击创建按钮**
   - 定位：【创建企业自建应用】按钮

2. **填写表单**
   - 应用名称：`openclaw`
   - 应用描述：`企业自建应用，用于openclaw安装助手`

3. **提交创建**
   - 点击【创建】按钮

#### 阶段 3：添加机器人
1. **进入应用详情**
2. **点击【添加应用能力】**
3. **选择【机器人】**
4. **点击【添加】**

#### 阶段 4：获取凭证
1. **进入凭证页面**
   - 菜单：【凭证与基础信息】

2. **抓取数据**
   - App ID：页面显示值
   - App Secret：点击显示后抓取

3. **暂存数据**
   - 存储到内存变量

#### 阶段 5：配置权限
1. **进入权限管理**
   - 菜单：【权限管理】

2. **批量导入权限**
   - 点击【批量导入/导出权限】
   - 粘贴权限 JSON：
     ```json
     {
       "permissions": [
         "im:chat:readonly",
         "im:message:send",
         "im:message:receive",
         "im:message.group:send"
       ]
     }
     ```

3. **申请开通**
   - 点击【申请开通】
   - 等待 10 秒
   - 点击【确认】

#### 阶段 6：发布版本
1. **进入版本管理**
   - 菜单：【版本管理与发布】

2. **创建版本**
   - 点击【创建版本】
   - 版本号：`1.0.0`
   - 更新说明：`机器人`
   - 点击【保存】

3. **申请发布**
   - 点击【申请发布】

#### 阶段 7：配置事件订阅
1. **进入事件配置**
   - 菜单：【事件与回调】

2. **启用订阅**
   - 点击订阅方式【编辑】
   - 点击【保存】

3. **添加事件**
   - 点击【添加事件】
   - 搜索：`im.message.receive_v1`
   - 勾选并【确认添加】

#### 阶段 8：写入配置并重启
1. **写入渠道配置**
   - 调用 IPC：`configFeishuChannel(appId, appSecret)`
   - 写入 `openclaw.json`：
     ```json
     {
       "channels": {
         "feishu": {
           "appId": "{appId}",
           "appSecret": "{appSecret}"
         }
       }
     }
     ```

2. **重启服务**
   - 执行：`openclaw gateway restart`

---

### 3.3 配对码处理

**触发条件**：检测到需要配对码（从日志中捕获）

**业务逻辑**：
1. **弹出输入框**
   - 提示："请输入飞书配对码"

2. **执行配对命令**
   - 执行：`openclaw pairing approve feishu {配对码}`

---

## 4. 一键诊断

### 4.1 环境诊断

**检测项及命令**：

| 检测项 | 命令 | 成功标准 |
|--------|------|----------|
| Node.js | `node -v` | 返回版本号且 >= 22.0.0 |
| NPM | `npm -v` | 返回版本号 |
| OpenClaw | `openclaw --version` | 返回版本号 |
| 网关端口 | `Test-NetConnection -ComputerName localhost -Port 18789` | TcpTestSucceeded = True |

---

### 4.2 配置诊断

**检测项**：

1. **AI 配置**
   - 读取 `openclaw.json`
   - 检查 `agents.list` 是否存在
   - 检查 `agents.list[0].apiKey` 是否设置

2. **渠道配置**
   - 读取 `openclaw.json`
   - 检查 `channels.feishu.appId` 是否存在
   - 检查 `channels.feishu.appSecret` 是否存在

---

### 4.3 插件诊断

**检测命令**：
- 执行：`openclaw plugins list`
- 解析输出，获取已安装插件列表

---

## 5. 卸载清理

### 5.1 卸载流程

**触发条件**：点击"确认卸载"按钮

**业务逻辑**：
1. **停止服务**
   - 查找并终止 openclaw 相关进程

2. **卸载软件**
   - 执行：`npm uninstall -g openclaw`

3. **删除配置**
   - 删除目录：`~/.openclaw/`
   - 保留 `settings.json`（安装助手配置）

4. **清理缓存**
   - 删除 npm 缓存中的 openclaw 相关包

---

## 6. 设置

### 6.1 配置路径管理

**获取当前路径**：
- 调用 IPC：`getConfigPath()`
- 读取 `settings.json` 中的 `configPath` 字段

**修改路径**：
- 调用 IPC：`setConfigPath(newPath)`
- 更新 `settings.json`：
  ```json
  {
    "configPath": "新的配置文件路径"
  }
  ```

### 6.2 下载配置管理

**存储位置**：`localStorage` - key: `openclaw-download-config`

**配置内容**：
```json
{
  "downloads": {
    "nodejs": {
      "autoDownload": {
        "url": "下载URL",
        "mirror": "镜像名称"
      },
      "manualDownload": {
        "url": "手动下载页面URL"
      }
    },
    "git": { ... },
    "openclaw": { ... }
  }
}
```

---

## 附录：配置文件说明

### settings.json（安装助手配置）

**路径**：
- 开发环境：`src/config/settings.json`
- 生产环境：`%APPDATA%/openclaw-install/settings.json`

**内容**：
```json
{
  "configPath": "C:\\Users\\{用户名}\\.openclaw\\openclaw.json"
}
```

### openclaw.json（OpenClaw 配置）

**默认路径**：`~/.openclaw/openclaw.json`

**主要配置项**：
```json
{
  "agents": {
    "list": [...],
    "defaults": {...}
  },
  "channels": {
    "feishu": {
      "appId": "...",
      "appSecret": "..."
    }
  }
}
```
