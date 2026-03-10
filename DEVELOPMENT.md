# 🔥 热加载开发指南

## 📋 目录
- [快速开始](#快速开始)
- [热加载工作原理](#热加载工作原理)
- [常见问题解决](#常见问题解决)

---

## 🚀 快速开始

### 方式一：一键启动（推荐）✨

```bash
npm run dev:electron
```

**优势：**
- ✅ 自动同时启动 Vite 和 Electron
- ✅ 等待 Vite 就绪后再启动 Electron
- ✅ 支持完整的热加载功能

### 方式二：手动双终端

**终端 1 - 启动 Vite：**
```bash
npm run dev
```

**终端 2 - 启动 Electron：**
```bash
npx cross-env VITE_DEV_SERVER_URL=http://localhost:5173 electron .
```

---

## 🔥 热加载工作原理

### 支持的热更新类型

| 修改内容 | 更新方式 | 说明 |
|---------|---------|------|
| **React 组件 (.tsx/.ts)** | ⚡ 即时热更新 | 保存后 100-300ms 内自动刷新界面 |
| **CSS 样式** | ⚡ 即时热更新 | 保存后立即生效 |
| **静态资源 (图片等)** | 🔄 页面刷新 | 自动刷新整个页面 |
| **Vite 配置** | ❌ 需要重启 | 需重新启动 Vite 服务器 |

### Electron 主进程代码

| 文件 | 更新方式 |
|------|---------|
| `electron/main.js` | ❌ 需要重启 Electron |
| `electron/preload.cjs` | ❌ 需要重启 Electron |
| `electron/preload.js` | ❌ 需要重启 Electron |

---

## 💡 开发工作流

### 1. 启动开发环境

```bash
# 推荐：一键启动
npm run dev:electron

# 或者：手动双终端
# 终端 1: npm run dev
# 终端 2: npx cross-env VITE_DEV_SERVER_URL=http://localhost:5173 electron .
```

### 2. 使用外部编辑器修改代码

- ✅ **VS Code**: 完美支持，保存即更新
- ✅ **WebStorm**: 完美支持，保存即更新
- ✅ **Sublime Text**: 完美支持，保存即更新
- ✅ **Notepad++**: 完美支持，保存即更新
- ✅ **任何文本编辑器**: 只要文件保存，就会触发更新

### 3. 查看更新效果

- 修改保存后，界面会在 **100-300ms** 内自动更新
- 如果更新失败，按 **F5** 或 **Ctrl+R** 刷新页面
- 开发者工具快捷键：**Ctrl+Shift+I** 或 **F12**

---

## 🔧 常见问题解决

### Q1: 修改代码后没有自动更新？

**解决方案：**
1. 检查 Vite 服务器是否正常运行（终端应有 `ready` 输出）
2. 检查 Electron 是否连接了 Vite（地址应为 `http://localhost:5173`）
3. 手动刷新页面：**F5** 或 **Ctrl+R**
4. 重启开发环境

### Q2: 白屏或报错？

**解决方案：**
1. 打开开发者工具查看错误信息（**Ctrl+Shift+I**）
2. 检查 TypeScript 编译错误
3. 检查控制台是否有红色错误信息
4. 根据错误提示修复代码

### Q3: 开发者工具打不开？

**解决方案：**
- 快捷键：**Ctrl+Shift+I** 或 **F12**
- 或者在 `electron/main.js` 中确保有这行代码：
  ```javascript
  mainWindow.webContents.openDevTools();
  ```

### Q4: 端口被占用？

**解决方案：**
```bash
# 修改 vite.config.ts 中的端口号
server: {
  port: 5174,  // 改为其他端口
}
```

然后重启时记得修改环境变量：
```bash
npx cross-env VITE_DEV_SERVER_URL=http://localhost:5174 electron .
```

---

## 🎯 最佳实践

### ✅ 推荐

1. **保持开发者工具打开** - 实时查看日志和错误
2. **使用一键启动命令** - `npm run dev:electron`
3. **修改后等待 1-2 秒** - 给热更新一些时间
4. **定期清理浏览器缓存** - 避免旧代码干扰

### ❌ 避免

1. ~~不要直接修改 `dist/` 目录的文件~~
2. ~~不要在 Electron 中使用 `file://` 协议加载 HTML~~
3. ~~不要在开发模式下测试打包功能~~

---

## 📝 常用命令速查

```bash
# 开发环境
npm run dev                    # 只启动 Vite
npm run dev:electron          # 一键启动完整开发环境

# 构建
npm run build                 # 构建生产版本
npm run electron:build        # 构建并打包 Electron 应用

# 测试
npm run test                  # 运行所有测试
npm run test:unit             # 运行单元测试
npm run test:e2e              # 运行端到端测试
```

---

## 🆘 需要帮助？

如果遇到问题：
1. 检查本指南的常见问题部分
2. 查看开发者工具的控制台错误
3. 查看 Vite 终端的输出日志
4. 尝试重启开发环境

**祝开发愉快！** 🎉
