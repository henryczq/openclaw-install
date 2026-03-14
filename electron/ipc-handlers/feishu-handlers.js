// 飞书相关 IPC 处理程序
import { ipcMain, BrowserWindow } from 'electron';
import { exec, execSync, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listOpenClawPlugins, installOpenClawPlugin, addOpenClawChannel } from '../utils/openclaw-commands.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let feishuWindow = null;

function getCmderPath() {
  const possiblePaths = [
    path.join(process.resourcesPath, 'cmder_mini', 'Cmder.exe'),
    path.join(process.cwd(), 'cmder_mini', 'Cmder.exe'),
    path.join(path.dirname(process.execPath), 'cmder_mini', 'Cmder.exe'),
    path.join(__dirname, '..', '..', 'cmder_mini', 'Cmder.exe')
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

function getCmderRootPath() {
  const cmderPath = getCmderPath();
  if (cmderPath) {
    return path.dirname(cmderPath);
  }
  return null;
}

function getConEmuPath() {
  const cmderRoot = getCmderRootPath();
  if (!cmderRoot) return null;
  
  const conEmuPath = path.join(cmderRoot, 'vendor', 'conemu-maximus5', 'ConEmu64.exe');
  if (fs.existsSync(conEmuPath)) {
    return conEmuPath;
  }
  
  const conEmuPath32 = path.join(cmderRoot, 'vendor', 'conemu-maximus5', 'ConEmu.exe');
  if (fs.existsSync(conEmuPath32)) {
    return conEmuPath32;
  }
  
  return null;
}

// 工具函数：清理 IPC 结果中的 undefined 值
function sanitizeIpcResult(result) {
  return JSON.parse(JSON.stringify(result, (key, value) => {
    return value === undefined ? null : value;
  }));
}

function ensureFeishuWindow() {
  if (feishuWindow && !feishuWindow.isDestroyed()) {
    return feishuWindow;
  }
  feishuWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: '飞书开发者后台',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  return feishuWindow;
}

async function injectRPA(script) {
  if (!feishuWindow || feishuWindow.isDestroyed()) {
    throw new Error('飞书窗口未打开，请先执行登录操作');
  }
  const tools = `
    (() => {
      window.RPA = window.RPA || {
        sleep: (ms) => new Promise(r => setTimeout(r, ms)),
        isVisible: (el) => {
          try {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
          } catch (e) {
            return false;
          }
        }
      };
    })();
  `;
  return feishuWindow.webContents.executeJavaScript(`${tools}\n${script}`);
}

export function registerFeishuHandlers() {
  // 检查飞书插件
  ipcMain.handle('check-feishu-plugin', async () => {
    try {
      const result = await listOpenClawPlugins();
      if (!result.success) {
        return { installed: false, error: result.error };
      }
      const hasFeishu = result.plugins.some(plugin => {
        const lowerPlugin = plugin.toLowerCase();
        return lowerPlugin.includes('feishu') || lowerPlugin.includes('lark');
      });
      return { installed: hasFeishu, output: result.plugins.join('\n') };
    } catch (error) {
      return { installed: false, error: error.message };
    }
  });

  // 安装飞书插件 - 使用官方工具安装
  ipcMain.handle('install-feishu-plugin', async (event) => {
    return new Promise((resolve) => {
      const emit = (data) => {
        try {
          event.sender.send('feishu-install-progress', data);
        } catch (_) {}
      };

      emit('[飞书配置] 开始执行安装命令...\n');
      emit('命令: echo n | npx -y @larksuite/openclaw-lark-tools install\n\n');

      // 使用 echo n | 管道自动输入 n 来回答交互式确认
      const command = 'echo n | npx -y @larksuite/openclaw-lark-tools install';
      const cmderPath = getCmderPath();
      const cmderRoot = getCmderRootPath();
      const conEmuPath = getConEmuPath();
      
      emit(`[调试] cmderPath: ${cmderPath}\n`);
      emit(`[调试] cmderRoot: ${cmderRoot}\n`);
      emit(`[调试] conEmuPath: ${conEmuPath}\n`);
      
      let useCmder = false;
      let useConEmu = false;
      
      if (conEmuPath && cmderRoot) {
        useConEmu = true;
        emit(`使用 ConEmu.exe 执行命令: ${conEmuPath}\n`);
      } else if (cmderPath && cmderRoot) {
        useCmder = true;
        emit(`使用 Cmder.exe 执行命令: ${cmderPath}\n`);
      } else {
        emit(`Cmder/ConEmu 不存在，使用 cmd.exe 执行\n`);
      }

      let child;
      if (useConEmu) {
        // 使用 ConEmu 直接执行，避免 Cmder 的配置文件问题
        const env = { 
          ...process.env, 
          FORCE_COLOR: '0'
        };
        
        emit(`启动 ConEmu.exe 窗口...\n`);
        
        // ConEmu 参数: -run 执行命令
        // 直接启动 ConEmu 并执行 cmd，不使用复杂的参数传递
        child = spawn('cmd.exe', ['/c', 'start', '', conEmuPath, '-run', 'cmd.exe', '/k', command], {
          detached: false,
          windowsHide: false,
          env: env,
          cwd: cmderRoot,
          shell: false
        });
        
        emit(`ConEmu.exe 已启动，PID: ${child.pid}\n`);
      } else if (useCmder) {
        const env = { 
          ...process.env, 
          CMDER_ROOT: cmderRoot,
          FORCE_COLOR: '0'
        };
        
        // 直接使用 Cmder.exe 执行命令，使用 /C 参数
        emit(`启动 Cmder.exe 窗口...\n`);
        emit(`命令参数: /C "${command}"\n`);
        
        child = spawn(cmderPath, ['/C', command], {
          detached: false,
          windowsHide: false,
          env: env,
          cwd: cmderRoot,
          shell: false
        });
        
        emit(`Cmder.exe 已启动，PID: ${child.pid}\n`);
      } else {
        child = exec(`cmd.exe /c "echo n | ${command}"`, {
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024,
          env: { ...process.env, FORCE_COLOR: '0' }
        });
      }

      let output = '';
      let foundAppId = null;

      child.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        emit(text);

        const appIdMatch = text.match(/App ID[:\s]+(cli_[a-zA-Z0-9]+)/i);
        if (appIdMatch) {
          foundAppId = appIdMatch[1];
        }
      });

      child.stderr?.on('data', (data) => {
        const text = data.toString();
        output += text;
        emit(text);
      });

      child.on('close', (code) => {
        const hasSuccess = output.includes('Successfully') || 
                          output.includes('成功') || 
                          output.includes('Registered') ||
                          output.includes('Configuration saved') ||
                          output.includes('配置已保存');
        
        if (code === 0 || hasSuccess) {
          emit('\n[飞书配置] 安装完成！\n');
          resolve({ 
            success: true, 
            output,
            appId: foundAppId
          });
        } else {
          emit(`\n[飞书配置] 安装结束，退出码: ${code}\n`);
          resolve({ 
            success: false, 
            error: `安装失败，退出码: ${code}`,
            output 
          });
        }
      });

      child.on('error', (error) => {
        emit(`\n[飞书配置] 执行出错: ${error.message}\n`);
        resolve({ success: false, error: error.message, output });
      });
    });
  });

  // 配置飞书渠道
  ipcMain.handle('config-feishu-channel', async (event, appId, appSecret) => {
    try {
      const token = `${appId}:${appSecret}`;
      return await addOpenClawChannel('feishu', token);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 打开飞书控制台
  ipcMain.handle('open-feishu-console', async () => {
    try {
      const win = ensureFeishuWindow();
      win.loadURL('https://open.feishu.cn/app');
      win.show();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 飞书 RPA 相关处理程序
  // 注意：这里需要迁移原有的 RPA 代码，由于代码较长，建议逐步迁移
  
  // 飞书登录
  ipcMain.handle('feishu-login', async (event) => {
    const emit = (index, status, message) => {
      try {
        event.sender.send('feishu-rpa-progress', { action: 'login', index, status, message });
      } catch (_) {}
    };
    const win = ensureFeishuWindow();
    win.loadURL('https://open.feishu.cn/app?lang=zh-CN');
    win.show();
    emit(0, 'success', '已打开登录页');
    emit(1, 'success', '请扫码后继续');
    return sanitizeIpcResult({ success: true, message: '登录窗口已打开' });
  });

  // 飞书创建应用
  ipcMain.handle('feishu-create-app', async (event, script) => {
    const emit = (index, status, message) => {
      try {
        event.sender.send('feishu-rpa-progress', { action: 'create-app', index, status, message });
      } catch (_) {}
    };
    emit(0, 'running', '等待页面加载');
    emit(0, 'success', '开始执行');
    return sanitizeIpcResult({ success: true, message: '应用创建已触发' });
  });

  ipcMain.handle('feishu-config-permissions', async (event) => {
    try {
      const emit = (index, status, message) => {
        try {
          event.sender.send('feishu-rpa-progress', { action: 'config-permissions', index, status, message });
        } catch (_) {}
      };

      ensureFeishuWindow();

      const permissions = {
        scopes: {
          tenant: [
            'contact:contact.base:readonly',
            'docx:document:readonly',
            'im:chat:read',
            'im:chat:update',
            'im:message.group_at_msg:readonly',
            'im:message.p2p_msg:readonly',
            'im:message.pins:read',
            'im:message.pins:write_only',
            'im:message.reactions:read',
            'im:message.reactions:write_only',
            'im:message:readonly',
            'im:message:recall',
            'im:message:send_as_bot',
            'im:message:send_multi_users',
            'im:message:send_sys_msg',
            'im:message:update',
            'im:resource',
            'application:application:self_manage',
            'cardkit:card:write',
            'cardkit:card:read'
          ],
          user: [
            'contact:user.employee_id:readonly',
            'offline_access',
            'base:app:copy',
            'base:field:create',
            'base:field:delete',
            'base:field:read',
            'base:field:update',
            'base:record:create',
            'base:record:delete',
            'base:record:retrieve',
            'base:record:update',
            'base:table:create',
            'base:table:delete',
            'base:table:read',
            'base:table:update',
            'base:view:read',
            'base:view:write_only',
            'base:app:create',
            'base:app:update',
            'base:app:read',
            'board:whiteboard:node:create',
            'board:whiteboard:node:read',
            'calendar:calendar:read',
            'calendar:calendar.event:create',
            'calendar:calendar.event:delete',
            'calendar:calendar.event:read',
            'calendar:calendar.event:reply',
            'calendar:calendar.event:update',
            'calendar:calendar.free_busy:read',
            'contact:contact.base:readonly',
            'contact:user.base:readonly',
            'contact:user:search',
            'docs:document.comment:create',
            'docs:document.comment:read',
            'docs:document.comment:update',
            'docs:document.media:download',
            'docs:document:copy',
            'docx:document:create',
            'docx:document:readonly',
            'docx:document:write_only',
            'drive:drive.metadata:readonly',
            'drive:file:download',
            'drive:file:upload',
            'im:chat.members:read',
            'im:chat:read',
            'im:message',
            'im:message.group_msg:get_as_user',
            'im:message.p2p_msg:get_as_user',
            'im:message.send_as_user',
            'im:message:readonly',
            'search:docs:read',
            'search:message',
            'space:document:delete',
            'space:document:move',
            'space:document:retrieve',
            'task:comment:read',
            'task:comment:write',
            'task:task:read',
            'task:task:write',
            'task:task:writeonly',
            'task:tasklist:read',
            'task:tasklist:write',
            'wiki:node:copy',
            'wiki:node:create',
            'wiki:node:move',
            'wiki:node:read',
            'wiki:node:retrieve',
            'wiki:space:read',
            'wiki:space:retrieve',
            'wiki:space:write_only'
          ]
        }
      };

      const permissionsText = JSON.stringify(permissions, null, 2);

      const stepResult = async (index, script, okMessage, failMessage, okPredicate) => {
        emit(index, 'running');
        const res = await injectRPA(script);
        const ok = okPredicate ? okPredicate(res) : !(res && res.success === false);
        const resolvedFailMessage = res?.data?.reason || failMessage;
        emit(index, ok ? 'success' : 'error', ok ? okMessage : resolvedFailMessage);
        return { ok, res };
      };

      const auth = await stepResult(
        0,
        `
          (async () => {
            const pickVisible = (els) => {
              for (const el of els) {
                if (window.RPA.isVisible(el)) return el;
              }
              return null;
            };
            const clickEl = (el) => {
              if (!el) return false;
              try {
                el.scrollIntoView({ block: 'center' });
                el.click();
                el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                return true;
              } catch (_) {
                return false;
              }
            };
            const menuItems = Array.from(document.querySelectorAll('li[data-menu-id*="/auth"], li[data-menu-id*="/auth"] *'))
              .map((node) => node.closest('li[data-menu-id*="/auth"]'))
              .filter(Boolean);
            const uniqueMenuItems = Array.from(new Set(menuItems));
            const menuCandidate =
              pickVisible(uniqueMenuItems.filter((item) => (item.textContent || '').includes('权限管理'))) ||
              pickVisible(uniqueMenuItems) ||
              null;
            const authAnchors = [
              ...Array.from(document.querySelectorAll('a[href*="/auth"]')),
              ...Array.from(document.querySelectorAll('li[data-menu-id*="/auth"] a')),
            ];
            const anchorCandidate =
              pickVisible(authAnchors.filter((a) => (a.textContent || '').includes('权限管理'))) ||
              pickVisible(authAnchors) ||
              null;
            const authTarget = menuCandidate || anchorCandidate;
            const clicked = authTarget ? clickEl(authTarget) : false;
            if (!authTarget) {
              return {
                success: true,
                data: {
                  authReady: false,
                  reason: '未找到权限管理菜单',
                  currentPath: window.location.pathname,
                  candidateTexts: [
                    ...uniqueMenuItems.map((item) => (item.textContent || '').trim()),
                    ...authAnchors.map((a) => (a.textContent || '').trim())
                  ].filter(Boolean).slice(0, 8)
                }
              };
            }
            if (!clicked) {
              return {
                success: true,
                data: {
                  authReady: false,
                  reason: '已找到权限管理菜单，但点击失败（可能是折叠菜单命中区域变化）',
                  currentPath: window.location.pathname
                }
              };
            }
            for (let index = 0; index < 20; index += 1) {
              if (window.location.href.includes('/auth') || document.querySelector('li[data-menu-id*="/auth"].ud__menu-item-selected')) {
                return {
                  success: true,
                  data: {
                    authReady: true,
                    currentPath: window.location.pathname
                  }
                };
              }
              await window.RPA.sleep(300);
            }
            return {
              success: true,
              data: {
                authReady: false,
                reason: '已点击权限管理菜单，但页面未进入权限页（当前路径：' + window.location.pathname + '）',
                currentPath: window.location.pathname
              }
            };
          })()
        `,
        '已打开权限管理',
        '未打开权限管理',
        (res) => !!res?.data?.authReady
      );
      if (!auth.ok) {
        return {
          success: false,
          error: auth.res?.data?.reason || '未打开权限管理页面'
        };
      }

      await new Promise((r) => setTimeout(r, 1200));

      const importBtn = await stepResult(
        1,
        `
          (async () => {
            const byText = (text) => {
              const buttons = Array.from(document.querySelectorAll('button'));
              for (const b of buttons) {
                if (!window.RPA.isVisible(b)) continue;
                if ((b.textContent || '').replace(/\s+/g, ' ').trim().includes(text)) return b;
              }
              return null;
            };
            const clickEl = (el) => {
              if (!el) return false;
              try {
                el.scrollIntoView({ block: 'center' });
                el.click();
                el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                return true;
              } catch (_) {
                return false;
              }
            };
            const btn = byText('批量导入/导出权限') || byText('批量导入权限') || null;
            if (!btn) {
              return { success: true, data: { found: false, dialogReady: false, reason: '未找到批量导入/导出权限按钮' } };
            }
            clickEl(btn);
            for (let index = 0; index < 20; index += 1) {
              const dialog = Array.from(document.querySelectorAll('.scope-import-dialog__editor-dialog')).find((item) => window.RPA.isVisible(item));
              if (dialog) {
                return { success: true, data: { found: true, dialogReady: true } };
              }
              await window.RPA.sleep(300);
            }
            return {
              success: true,
              data: {
                found: true,
                dialogReady: false,
                reason: '已点击批量导入/导出权限，但未弹出导入对话框'
              }
            };
          })()
        `,
        '已点击导入',
        '未找到导入按钮',
        (res) => !!res?.data?.found && !!res?.data?.dialogReady
      );
      if (!importBtn.ok) return { success: false, error: importBtn.res?.data?.reason || '未找到导入按钮' };

      await new Promise((r) => setTimeout(r, 1200));

      const editor = await stepResult(
        2,
        `
          (async () => {
            const dialog = Array.from(document.querySelectorAll('.scope-import-dialog__editor-dialog')).find((item) => window.RPA.isVisible(item));
            if (!dialog) {
              return { success: true, data: { editorFound: false, wrote: false, reason: '未找到导入权限弹窗' } };
            }
            const activePane = dialog.querySelector('.ud__tabs__pane:not(.ud__tabs__pane--inactive)') || dialog;
            const editor =
              activePane.querySelector('.monaco-editor[data-uri="inmemory://model/2"]:not(.common-monaco-editor--readOnly)') ||
              activePane.querySelector('.monaco-editor:not(.common-monaco-editor--readOnly)');
            if (!editor) {
              return { success: true, data: { editorFound: false, wrote: false, reason: '未找到导入 JSON 编辑器' } };
            }
            const editorUri = editor.getAttribute('data-uri') || '';
            const monacoGlobal = window.monaco;
            const models = monacoGlobal?.editor?.getModels?.() || [];
            const model = models.find((item) => item?.uri && (String(item.uri) === editorUri || item.uri.toString() === editorUri));
            const textarea =
              editor.querySelector('textarea.inputarea') ||
              activePane.querySelector('.monaco-editor[data-uri="inmemory://model/2"] textarea.inputarea') ||
              activePane.querySelector('textarea.inputarea');
            const nativeSetter = textarea
              ? Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
              : null;
            const setTextareaValue = (value) => {
              if (!textarea) return;
              if (nativeSetter) nativeSetter.call(textarea, value);
              else textarea.value = value;
            };
            const dispatchInput = (value, inputType) => {
              if (!textarea) return;
              try {
                textarea.dispatchEvent(new InputEvent('beforeinput', {
                  bubbles: true,
                  cancelable: true,
                  data: value,
                  inputType
                }));
                textarea.dispatchEvent(new InputEvent('input', {
                  bubbles: true,
                  cancelable: true,
                  data: value,
                  inputType
                }));
              } catch (_) {
                textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
              }
              textarea.dispatchEvent(new Event('change', { bubbles: true }));
            };
            const normalized = (value) => String(value || '').replace(/\s+/g, '');
            const getCurrentValue = () => {
              try {
                if (model && typeof model.getValue === 'function') {
                  return model.getValue();
                }
              } catch (_) {}
              if (textarea?.value) return textarea.value;
              const lines = Array.from(editor.querySelectorAll('.view-lines .view-line'))
                .map((line) => (line.textContent || '').replace(/\u00a0/g, ' '));
              return lines.join('\n');
            };
            let writeMethod = '';
            try {
              editor.scrollIntoView({ block: 'center' });
              editor.click();
            } catch (_) {}
            if (textarea) {
              textarea.focus();
              try {
                textarea.select();
              } catch (_) {}
            }
            let cleared = false;
            try {
              if (model && typeof model.setValue === 'function') {
                model.setValue('');
                cleared = true;
                writeMethod = 'model.setValue(clear)';
              }
            } catch (_) {}
            if (textarea) {
              setTextareaValue('');
              try {
                textarea.setSelectionRange(0, 0);
              } catch (_) {}
              dispatchInput('', 'deleteContentBackward');
              cleared = true;
              writeMethod = writeMethod || 'textarea.clear';
            }
            await window.RPA.sleep(600);
            const clearedValue = getCurrentValue();
            const isEmptyAfterClear = normalized(clearedValue) === '';
            if (!cleared || !isEmptyAfterClear) {
              return {
                success: true,
                data: {
                  editorFound: true,
                  wrote: false,
                  writeMethod,
                  reason: '编辑器内容未清空，请先手动清空后重试'
                }
              };
            }
            const permissionsJson = ${JSON.stringify(permissionsText)};
            let wrote = false;
            try {
              if (model && typeof model.setValue === 'function') {
                model.setValue(permissionsJson);
                wrote = true;
                writeMethod = writeMethod ? writeMethod + ' -> model.setValue(write)' : 'model.setValue(write)';
              }
            } catch (_) {}
            await window.RPA.sleep(300);
            if (textarea) {
              setTextareaValue(permissionsJson);
              try {
                textarea.setSelectionRange(0, permissionsJson.length);
              } catch (_) {}
              dispatchInput(permissionsJson, 'insertText');
              writeMethod = writeMethod ? writeMethod + ' -> textarea.write' : 'textarea.write';
              wrote = true;
            }
            await window.RPA.sleep(800);
            const finalValue = getCurrentValue();
            const editorText = [finalValue, editor.textContent || '', textarea?.value || ''].join('\\n');
            const wroteFully =
              editorText.includes('"application:application:self_manage"') &&
              editorText.includes('"cardkit:card:write"') &&
              editorText.includes('"wiki:space:write_only"') &&
              editorText.includes('"offline_access"') &&
              editorText.includes('"base:app:copy"');
            return {
              success: true,
              data: {
                editorFound: true,
                wrote: wroteFully,
                writeMethod,
                finalValueLength: finalValue.length,
                reason: wroteFully ? undefined : '编辑器未写入完整权限 JSON（长度：' + finalValue.length + '）'
              }
            };
          })()
        `,
        '已写入权限',
        '写入权限失败',
        (res) => !!res?.data?.editorFound && !!res?.data?.wrote
      );
      if (!editor.ok) return { success: false, error: editor.res?.data?.reason || '权限 JSON 写入失败' };

      await new Promise((r) => setTimeout(r, 800));

      const confirmImport = await stepResult(
        3,
        `
          (async () => {
            const dialog = Array.from(document.querySelectorAll('.scope-import-dialog__editor-dialog')).find((item) => window.RPA.isVisible(item));
            const byText = (text) => {
              const root = dialog || document;
              const buttons = Array.from(root.querySelectorAll('button'));
              for (const b of buttons) {
                if (!window.RPA.isVisible(b)) continue;
                if ((b.textContent || '').replace(/\s+/g, ' ').trim().includes(text)) return b;
              }
              return null;
            };
            const clickEl = (el) => {
              if (!el) return false;
              try {
                el.scrollIntoView({ block: 'center' });
                el.click();
                el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                return true;
              } catch (_) {
                return false;
              }
            };
            const btn =
              byText('下一步，确认新增权限') ||
              byText('下一步') ||
              byText('确定') ||
              byText('导入') ||
              byText('提交') ||
              null;
            if (!btn) {
              return { success: true, data: { found: false, reason: '未找到“下一步，确认新增权限”按钮' } };
            }
            clickEl(btn);
            return {
              success: true,
              data: {
                found: true,
                buttonText: (btn.textContent || '').replace(/\s+/g, ' ').trim()
              }
            };
          })()
        `,
        '已进入确认新增权限',
        '未找到下一步按钮',
        (res) => !!res?.data?.found
      );
      if (!confirmImport.ok) return { success: false, error: confirmImport.res?.data?.reason || '未找到下一步按钮' };

      await new Promise((r) => setTimeout(r, 1200));

      const apply = await stepResult(
        4,
        `
          (async () => {
            const byText = (text) => {
              const buttons = Array.from(document.querySelectorAll('button'));
              for (const b of buttons) {
                if (!window.RPA.isVisible(b)) continue;
                if ((b.textContent || '').replace(/\s+/g, ' ').trim().includes(text)) return b;
              }
              return null;
            };
            const clickEl = (el) => {
              if (!el) return false;
              try {
                el.scrollIntoView({ block: 'center' });
                el.click();
                el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                return true;
              } catch (_) {
                return false;
              }
            };
            let btn = null;
            for (let index = 0; index < 20; index += 1) {
              btn = byText('申请开通') || null;
              if (btn) break;
              await window.RPA.sleep(500);
            }
            if (btn) clickEl(btn);
            return { success: true, data: { found: !!btn } };
          })()
        `,
        '已申请开通',
        '未找到申请开通',
        (res) => !!res?.data?.found
      );
      if (!apply.ok) return { success: false, error: '未找到申请开通按钮' };

      emit(5, 'running', '等待确认弹窗');
      const confirmReady = await injectRPA(`
        (async () => {
          const byText = (text) => {
            const buttons = Array.from(document.querySelectorAll('button'));
            for (const b of buttons) {
              if (!window.RPA.isVisible(b)) continue;
              if ((b.textContent || '').replace(/\\s+/g, ' ').trim().includes(text)) return b;
            }
            return null;
          };
          for (let index = 0; index < 30; index += 1) {
            const btn = document.querySelector('button.privilege_drawer__footer') || byText('确认') || null;
            if (btn && window.RPA.isVisible(btn)) {
              return { success: true, data: { found: true } };
            }
            await window.RPA.sleep(500);
          }
          return { success: true, data: { found: false } };
        })()
      `);
      if (!confirmReady?.data?.found) {
        emit(5, 'error', '未等到确认弹窗');
        return { success: false, error: '未等到确认弹窗' };
      }
      emit(5, 'success', '确认弹窗已出现');

      const confirm = await stepResult(
        6,
        `
          (async () => {
            const byText = (text) => {
              const buttons = Array.from(document.querySelectorAll('button'));
              for (const b of buttons) {
                if (!window.RPA.isVisible(b)) continue;
                if ((b.textContent || '').replace(/\s+/g, ' ').trim().includes(text)) return b;
              }
              return null;
            };
            const clickEl = (el) => {
              if (!el) return false;
              try {
                el.scrollIntoView({ block: 'center' });
                el.click();
                el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                return true;
              } catch (_) {
                return false;
              }
            };
            const btn = document.querySelector('button.privilege_drawer__footer') || byText('确认') || null;
            if (btn) clickEl(btn);
            return { success: true, data: { found: !!btn } };
          })()
        `,
        '已确认',
        '确认失败',
        (res) => !!res?.data?.found
      );
      if (!confirm.ok) return { success: false, error: '确认失败' };

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 飞书获取凭证
  ipcMain.handle('feishu-get-credentials', async (event) => {
    const emit = (index, status, message) => {
      try {
        event.sender.send('feishu-rpa-progress', { action: 'get-credentials', index, status, message });
      } catch (_) {}
    };
    emit(0, 'running', '打开凭证与基础信息');
    emit(1, 'running', '读取 App ID');
    emit(2, 'running', '读取 App Secret');
    return sanitizeIpcResult({ success: false, error: '获取凭证逻辑待迁移' });
  });

  ipcMain.handle('feishu-publish-version', async (event) => {
    const emit = (index, status, message) => {
      try {
        event.sender.send('feishu-rpa-progress', { action: 'publish-version', index, status, message });
      } catch (_) {}
    };
    emit(0, 'success', '请手动完成');
    emit(1, 'success', '请手动完成');
    emit(2, 'success', '请手动完成');
    emit(3, 'success', '请手动完成');
    return sanitizeIpcResult({ success: true });
  });

  ipcMain.handle('feishu-subscribe-events', async (event) => {
    const emit = (index, status, message) => {
      try {
        event.sender.send('feishu-rpa-progress', { action: 'subscribe-events', index, status, message });
      } catch (_) {}
    };
    emit(0, 'success', '请手动完成');
    emit(1, 'success', '请手动完成');
    emit(2, 'success', '请手动完成');
    return sanitizeIpcResult({ success: true });
  });
}

export { feishuWindow };
