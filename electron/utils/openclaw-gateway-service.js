// OpenClaw Gateway 服务管理工具
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 检查 OpenClaw 是否已安装
 * @param {boolean} strictMode - 是否使用严格模式（检查是否能执行插件列表命令）
 * @returns {Promise<{installed: boolean, version?: string, error?: string}>}
 */
export async function checkOpenClawInstalled(strictMode = false) {
  try {
    await execAsync('chcp 65001', { shell: 'cmd.exe' }).catch(() => {});
    const { stdout } = await execAsync('openclaw --version');
    const versionMatch = stdout.trim().match(/(\d+\.\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : stdout.trim();
    
    // 严格模式：额外检查是否能正常执行插件列表命令
    if (strictMode) {
      try {
        await execAsync('openclaw plugins list', { timeout: 10000 });
      } catch (pluginError) {
        // 插件列表命令执行失败，说明安装可能还未完成
        return { 
          installed: false, 
          error: 'OpenClaw 安装中，请等待安装完成',
          version 
        };
      }
    }
    
    return {
      installed: true,
      version
    };
  } catch (error) {
    return { installed: false, error: error.message };
  }
}

/**
 * 安装 OpenClaw Gateway 服务
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function installOpenClawGateway(timeout = 60000) {
  try {
    const checkResult = await checkOpenClawInstalled();
    if (!checkResult.installed) {
      return { success: false, error: 'OpenClaw 未安装，请先安装 OpenClaw' };
    }

    console.log('[openclaw-gateway-service] 正在安装 OpenClaw Gateway...');
    const { stdout } = await execAsync('openclaw gateway install', { timeout });
    console.log('[openclaw-gateway-service] OpenClaw Gateway 安装成功');
    return { success: true, message: '服务安装成功', output: stdout };
  } catch (error) {
    console.error('[openclaw-gateway-service] 安装 OpenClaw Gateway 失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 启动 OpenClaw Gateway 服务
 * 如果服务未安装，会先执行安装
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function startOpenClawGateway(timeout = 30000) {
  try {
    const checkResult = await checkOpenClawInstalled();
    if (!checkResult.installed) {
      return { success: false, error: 'OpenClaw 未安装，请先安装 OpenClaw' };
    }

    console.log('[openclaw-gateway-service] 正在启动 OpenClaw Gateway...');
    
    try {
      const { stdout } = await execAsync('openclaw gateway start', { timeout });
      console.log('[openclaw-gateway-service] OpenClaw Gateway 启动成功');
      return { success: true, message: '服务启动成功', output: stdout };
    } catch (startError) {
      // 检查是否是服务未安装的错误
      const errorMsg = startError.message || '';
      const stderr = startError.stderr || '';
      const output = errorMsg + stderr;
      
      if (output.includes('Gateway service missing') || output.includes('gateway install')) {
        console.log('[openclaw-gateway-service] Gateway 服务未安装，先执行安装...');
        
        // 先安装服务
        const installResult = await installOpenClawGateway(timeout);
        if (!installResult.success) {
          return { 
            success: false, 
            error: `Gateway 服务安装失败: ${installResult.error}` 
          };
        }
        
        // 安装成功后重新启动
        console.log('[openclaw-gateway-service] 服务安装完成，重新启动...');
        const { stdout } = await execAsync('openclaw gateway start', { timeout });
        console.log('[openclaw-gateway-service] OpenClaw Gateway 启动成功');
        return { success: true, message: '服务安装并启动成功', output: stdout };
      }
      
      // 其他错误，直接抛出
      throw startError;
    }
  } catch (error) {
    console.error('[openclaw-gateway-service] 启动 OpenClaw Gateway 失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 停止 OpenClaw Gateway 服务
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function stopOpenClawGateway(timeout = 30000) {
  try {
    const checkResult = await checkOpenClawInstalled();
    if (!checkResult.installed) {
      return { success: false, error: 'OpenClaw 未安装，请先安装 OpenClaw' };
    }

    console.log('[openclaw-gateway-service] 正在停止 OpenClaw Gateway...');
    const { stdout } = await execAsync('openclaw gateway stop', { timeout });
    console.log('[openclaw-gateway-service] OpenClaw Gateway 停止成功');
    return { success: true, message: '服务停止成功', output: stdout };
  } catch (error) {
    console.error('[openclaw-gateway-service] 停止 OpenClaw Gateway 失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 重启 OpenClaw Gateway 服务
 * 容错机制：如果 restart 命令失败，则先 stop 再 start
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function restartOpenClawGateway(timeout = 30000) {
  try {
    const checkResult = await checkOpenClawInstalled();
    if (!checkResult.installed) {
      return { success: false, error: 'OpenClaw 未安装，请先安装 OpenClaw' };
    }

    console.log('[openclaw-gateway-service] 正在重启 OpenClaw Gateway...');
    
    // 首先尝试使用 restart 命令
    try {
      const { stdout } = await execAsync('openclaw gateway restart', { timeout });
      console.log('[openclaw-gateway-service] OpenClaw Gateway 重启成功（使用 restart 命令）');
      return { success: true, message: '服务重启成功', output: stdout };
    } catch (restartError) {
      console.log('[openclaw-gateway-service] restart 命令失败，尝试先 stop 再 start...');
      
      // restart 失败，使用 stop + start 方式
      const stopResult = await stopOpenClawGateway(timeout);
      if (!stopResult.success) {
        console.log('[openclaw-gateway-service] stop 失败，但可能服务本来就未运行，继续尝试 start...');
      }
      
      // 等待 1 秒确保服务完全停止
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const startResult = await startOpenClawGateway(timeout);
      if (startResult.success) {
        console.log('[openclaw-gateway-service] OpenClaw Gateway 重启成功（使用 stop + start 方式）');
        return { success: true, message: '服务重启成功（使用 stop + start 方式）', output: startResult.output };
      } else {
        throw new Error(startResult.error || '启动失败');
      }
    }
  } catch (error) {
    console.error('[openclaw-gateway-service] 重启 OpenClaw Gateway 失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 检查 Gateway 端口状态
 * @param {number} port - 端口号，默认 18789
 * @returns {Promise<{running: boolean, port: number}>}
 */
export async function checkGatewayStatus(port = 18789) {
  try {
    const { stdout } = await execAsync(`netstat -an | findstr :${port}`);
    const isRunning = stdout.includes(`:${port}`) && stdout.includes('LISTENING');
    return { running: isRunning, port };
  } catch (error) {
    // 如果命令执行失败，通常表示端口未被占用（服务未运行）
    return { running: false, port };
  }
}
