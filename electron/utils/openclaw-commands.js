// OpenClaw 命令工具集
import { exec, execSync } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 执行 OpenClaw 命令的基础函数
 * @param {string} command - 要执行的命令（不含 'openclaw ' 前缀）
 * @param {Object} options - 执行选项
 * @param {number} options.timeout - 超时时间（毫秒）
 * @param {boolean} options.useSync - 是否使用同步执行
 * @returns {Promise<{success: boolean, stdout?: string, stderr?: string, error?: string}>}
 */
export async function execOpenClawCommand(command, options = {}) {
  const { timeout = 30000, useSync = false } = options;
  const fullCommand = `openclaw ${command}`;
  
  try {
    console.log(`[openclaw-commands] 执行命令: ${fullCommand}`);
    
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
  if (result.success) {
    // 解析插件列表
    const plugins = result.stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('─') && !line.startsWith('┌') && !line.startsWith('├') && !line.startsWith('│') && !line.startsWith('└'))
      .filter(line => !line.includes('名称') && !line.includes('版本') && !line.includes('描述'));
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
  
  return new Promise((resolve) => {
    const command = `openclaw plugins install ${pluginName}`;
    console.log(`[openclaw-commands] 安装插件: ${pluginName}`);
    
    const child = exec(command, {
      encoding: 'utf8',
      shell: 'cmd.exe',
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
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`[openclaw-commands] 插件 ${pluginName} 安装成功`);
        resolve({ success: true, output });
      } else {
        console.error(`[openclaw-commands] 插件 ${pluginName} 安装失败，退出码: ${code}`);
        resolve({ success: false, error: `安装失败，退出码: ${code}`, output });
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
  const result = await execOpenClawCommand(
    `channels add --channel ${channel} --token "${token}"`,
    { timeout: 30000 }
  );
  if (result.success) {
    return { success: true, message: `${channel} 渠道配置成功` };
  }
  return { success: false, error: result.error };
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
