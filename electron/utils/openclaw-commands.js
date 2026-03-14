// OpenClaw 命令工具集
import { exec, execSync, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 检查是否在开发模式
 * @returns {boolean}
 */
function isDevMode() {
  // 检查多种可能的开发环境标志
  return process.env.NODE_ENV === 'development' || 
         process.env.DEBUG === 'true' ||
         process.env.OPENCLAW_DEV === 'true' ||
         !process.env.NODE_ENV; // 如果没有设置 NODE_ENV，默认认为是开发模式
}

/**
 * 执行 OpenClaw 命令的基础函数
 * @param {string} command - 要执行的命令（不含 'openclaw ' 前缀）
 * @param {Object} options - 执行选项
 * @param {number} options.timeout - 超时时间（毫秒）
 * @param {boolean} options.useSync - 是否使用同步执行
 * @param {boolean} options.showWindow - 是否显示命令行窗口（开发模式下默认true）
 * @returns {Promise<{success: boolean, stdout?: string, stderr?: string, error?: string}>}
 */
export async function execOpenClawCommand(command, options = {}) {
  const { timeout = 30000, useSync = false, showWindow = true } = options;
  const fullCommand = `openclaw ${command}`;
  
  console.log(`[openclaw-commands] 执行命令: ${fullCommand}`);
  console.log(`[openclaw-commands] 开发模式: ${isDevMode()}, 显示窗口: ${showWindow}`);
  
  // 开发模式下弹出命令行窗口执行
  if (showWindow && process.platform === 'win32') {
    return new Promise((resolve) => {
      // 使用 /wait 参数等待窗口关闭
      const cmdCommand = `start /wait "OpenClaw Command" cmd.exe /k "echo Executing: ${fullCommand} && ${fullCommand} && echo. && echo Command completed. Press any key to close... && pause >nul"`;
      
      console.log(`[openclaw-commands] 等待命令窗口执行完成...`);
      
      exec(cmdCommand, { timeout }, (error, stdout, stderr) => {
        if (error) {
          console.error(`[openclaw-commands] 命令执行失败: ${error.message}`);
          resolve({ 
            success: false, 
            error: error.message,
            stdout: stdout?.trim(),
            stderr: stderr?.trim()
          });
        } else {
          console.log(`[openclaw-commands] 命令窗口已关闭，继续下一步`);
          resolve({ success: true, stdout: 'Command completed in window', stderr: '' });
        }
      });
    });
  }
  
  try {
    if (useSync) {
      const stdout = execSync(fullCommand, { 
        encoding: 'utf8',
        timeout,
        shell: 'cmd.exe'
      });
      console.log(`[openclaw-commands] 命令执行成功`);
      return { success: true, stdout: stdout.trim() };
    } else {
      const { stdout, stderr } = await execAsync(fullCommand, { 
        timeout,
        shell: 'cmd.exe'
      });
      console.log(`[openclaw-commands] 命令执行成功`);
      return { success: true, stdout: stdout.trim(), stderr };
    }
  } catch (error) {
    console.error(`[openclaw-commands] 命令执行失败: ${error.message}`);
    return { 
      success: false, 
      error: error.message,
      stdout: error.stdout?.trim(),
      stderr: error.stderr?.trim()
    };
  }
}

/**
 * 获取 OpenClaw 版本
 * @returns {Promise<{success: boolean, version?: string, error?: string}>}
 */
export async function getOpenClawVersion() {
  const result = await execOpenClawCommand('--version', { timeout: 10000 });
  if (result.success) {
    const versionMatch = result.stdout.match(/(\d+\.\d+\.\d+)/);
    return { 
      success: true, 
      version: versionMatch ? versionMatch[1] : result.stdout 
    };
  }
  return { success: false, error: result.error };
}

/**
 * 检查 OpenClaw 是否已安装
 * @returns {Promise<{installed: boolean, version?: string, error?: string}>}
 */
export async function checkOpenClawInstalled() {
  const result = await getOpenClawVersion();
  if (result.success) {
    return { installed: true, version: result.version };
  }
  return { installed: false, error: result.error };
}

/**
 * 列出已安装的插件
 * @returns {Promise<{success: boolean, plugins?: string[], error?: string}>}
 */
export async function listOpenClawPlugins() {
  const result = await execOpenClawCommand('plugins list', { timeout: 30000 });
  console.log('[openclaw-commands] 插件列表原始输出:', result.stdout);
  
  if (result.success) {
    // 解析插件列表 - 改进解析逻辑
    const lines = result.stdout.split('\n').map(line => line.trim()).filter(Boolean);
    const plugins = [];
    
    for (const line of lines) {
      // 跳过表格边框和表头
      if (line.match(/^[─┌├┤└┐┘│\s]+$/) || 
          line.includes('名称') && line.includes('版本') ||
          line.includes('name') && line.includes('version')) {
        continue;
      }
      
      // 提取插件名称（通常是第一列）
      // 尝试匹配常见的插件名称格式
      const pluginMatch = line.match(/^([a-zA-Z0-9_-]+)/);
      if (pluginMatch) {
        const pluginName = pluginMatch[1];
        // 排除常见的非插件行
        if (!['plugins', 'plugin', 'total', 'count', 'no', 'yes'].includes(pluginName.toLowerCase())) {
          plugins.push(pluginName);
        }
      } else if (line.length > 0 && !line.startsWith('[')) {
        // 如果整行都是插件名（没有表格格式）
        plugins.push(line);
      }
    }
    
    console.log('[openclaw-commands] 解析后的插件列表:', plugins);
    return { success: true, plugins };
  }
  return { success: false, error: result.error };
}

/**
 * 安装 OpenClaw 插件
 * @param {string} pluginName - 插件名称
 * @param {Object} options - 选项
 * @param {Function} options.onProgress - 进度回调函数
 * @returns {Promise<{success: boolean, output?: string, error?: string}>}
 */
export async function installOpenClawPlugin(pluginName, options = {}) {
  const { onProgress } = options;
  
  return new Promise(async (resolve) => {
    // 先设置 UTF-8 编码
    try {
      await execAsync('chcp 65001', { shell: 'cmd.exe' });
    } catch (e) {
      // 忽略编码设置错误
    }
    
    // 使用 cmd /c 执行命令，确保环境变量正确加载
    const command = `cmd.exe /c "chcp 65001 >nul && openclaw plugins install ${pluginName}"`;
    console.log(`[openclaw-commands] 安装插件: ${pluginName}`);
    
    const child = exec(command, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    let output = '';
    
    child.stdout?.on('data', (data) => {
      const text = data.toString();
      output += text;
      if (onProgress) {
        onProgress(text);
      }
    });
    
    child.stderr?.on('data', (data) => {
      const text = data.toString();
      output += text;
      if (onProgress) {
        onProgress(text);
      }
    });
    
    child.on('close', async (code) => {
      // 检查输出中是否包含成功标志（插件注册信息）
      const hasSuccessIndicator = output.includes('Registered') || output.includes('已安装') || output.includes('success');
      const hasErrorIndicator = output.includes('error') || output.includes('Error') || output.includes('失败') || output.includes('ERR');
      const alreadyExists = output.includes('already exists') || output.includes('plugin already exists');
      
      // 如果插件已存在，尝试先卸载再安装
      if (alreadyExists && !hasSuccessIndicator) {
        console.log(`[openclaw-commands] 插件 ${pluginName} 已存在，尝试先卸载...`);
        try {
          // 使用 openclaw plugins uninstall 命令卸载
          const uninstallCommand = `cmd.exe /c "chcp 65001 >nul && openclaw plugins uninstall ${pluginName}"`;
          await execAsync(uninstallCommand, { timeout: 60000 });
          console.log(`[openclaw-commands] 插件 ${pluginName} 卸载成功，重新安装...`);
          
          // 重新执行安装
          const reinstallResult = await installOpenClawPlugin(pluginName, options);
          resolve(reinstallResult);
          return;
        } catch (uninstallError) {
          console.error(`[openclaw-commands] 插件卸载失败: ${uninstallError.message}`);
          // 如果卸载失败，但插件实际上已存在，也认为成功
          resolve({ success: true, output: `插件已存在: ${pluginName}` });
          return;
        }
      }
      
      // 如果退出码为0，或者输出包含成功标志且不包含错误标志，则认为成功
      if (code === 0 || (hasSuccessIndicator && !hasErrorIndicator)) {
        console.log(`[openclaw-commands] 插件 ${pluginName} 安装成功`);
        resolve({ success: true, output });
      } else {
        console.error(`[openclaw-commands] 插件 ${pluginName} 安装失败，退出码: ${code}`);
        console.error(`[openclaw-commands] 安装输出: ${output}`);
        resolve({ success: false, error: `安装失败，退出码: ${code}，输出: ${output || '无输出'}`, output });
      }
    });
    
    child.on('error', (error) => {
      console.error(`[openclaw-commands] 插件安装出错: ${error.message}`);
      resolve({ success: false, error: error.message, output });
    });
  });
}

/**
 * 添加渠道配置
 * @param {string} channel - 渠道名称（如 'qqbot', 'feishu'）
 * @param {string} token - 渠道令牌
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function addOpenClawChannel(channel, token) {
  // 先读取当前配置，用于后续验证
  const fs = await import('fs');
  const path = await import('path');
  const os = await import('os');
  
  const getConfigPath = () => {
    if (process.env.OPENCLAW_CONFIG_PATH) {
      return process.env.OPENCLAW_CONFIG_PATH;
    }
    const openclawDir = process.env.OPENCLAW_STATE_DIR || 
                       (process.env.OPENCLAW_HOME ? path.join(process.env.OPENCLAW_HOME, '.openclaw') : 
                        path.join(os.homedir(), '.openclaw'));
    return path.join(openclawDir, 'openclaw.json');
  };
  
  const configPath = getConfigPath();
  console.log(`[openclaw-commands] 配置文件路径: ${configPath}`);
  
  // 读取绑定前的配置
  let configBefore = null;
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      configBefore = JSON.parse(content);
      console.log(`[openclaw-commands] 绑定前配置:`, JSON.stringify(configBefore.channels, null, 2));
      
      // QQ渠道特殊处理：检查是否已存在相同 appId 的 qqbot 配置
      // 注意：此检查已移至前端第5步执行，这里不再重复处理
      // if (channel === 'qqbot' && configBefore.channels && configBefore.channels[channel]) {
      //   const existingConfig = configBefore.channels[channel];
      //   // token 格式是 "appId:appSecret"
      //   const currentAppId = token.split(':')[0];
      //   const existingAppId = existingConfig.token ? existingConfig.token.split(':')[0] : null;
      //   
      //   console.log(`[openclaw-commands] 检查QQ配置: 当前appId=${currentAppId}, 已有appId=${existingAppId}`);
      //   
      //   if (existingAppId === currentAppId) {
      //     console.log(`[openclaw-commands] 发现相同appId的qqbot配置，准备删除`);
      //     
      //     // 删除已有配置
      //     delete configBefore.channels[channel];
      //     
      //     // 写回配置文件
      //     try {
      //       fs.writeFileSync(configPath, JSON.stringify(configBefore, null, 2), 'utf-8');
      //       console.log(`[openclaw-commands] 已删除相同appId的qqbot配置`);
      //     } catch (writeError) {
      //       console.error(`[openclaw-commands] 删除配置失败:`, writeError.message);
      //       return { success: false, error: `删除现有配置失败: ${writeError.message}` };
      //     }
      //   }
      // }
    }
  } catch (e) {
    console.log(`[openclaw-commands] 读取绑定前配置失败:`, e.message);
  }
  
  const result = await execOpenClawCommand(
    `channels add --channel ${channel} --token "${token}"`,
    { timeout: 30000 }
  );
  
  if (!result.success) {
    console.error(`[openclaw-commands] 命令执行失败:`, result.error);
    return { success: false, error: result.error };
  }
  
  console.log(`[openclaw-commands] 命令执行成功，输出:`, result.stdout);
  
  // 验证配置文件是否真正写入
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      const configAfter = JSON.parse(content);
      console.log(`[openclaw-commands] 绑定后配置:`, JSON.stringify(configAfter.channels, null, 2));
      
      // 检查渠道是否存在于配置中
      if (configAfter.channels && configAfter.channels[channel]) {
        console.log(`[openclaw-commands] ✅ 渠道 ${channel} 已成功写入配置文件`);
        return { success: true, message: `${channel} 渠道配置成功`, config: configAfter.channels[channel] };
      } else {
        console.error(`[openclaw-commands] ❌ 渠道 ${channel} 未在配置文件中找到`);
        return { success: false, error: '渠道配置未写入配置文件，请检查 OpenClaw 配置' };
      }
    } else {
      console.error(`[openclaw-commands] ❌ 配置文件不存在: ${configPath}`);
      return { success: false, error: '配置文件不存在' };
    }
  } catch (e) {
    console.error(`[openclaw-commands] 验证配置失败:`, e.message);
    return { success: false, error: `验证配置失败: ${e.message}` };
  }
}

/**
 * 卸载 OpenClaw
 * @returns {Promise<{success: boolean, output?: string, error?: string}>}
 */
export async function uninstallOpenClaw() {
  try {
    const { stdout } = await execAsync('npm uninstall -g openclaw', { 
      timeout: 120000,
      shell: 'cmd.exe'
    });
    return { success: true, output: stdout };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
