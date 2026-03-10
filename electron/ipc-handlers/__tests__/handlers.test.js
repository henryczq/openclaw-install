import { describe, it, expect } from 'vitest';
import path from 'path';

describe('IPC Handlers 重构测试', () => {
  describe('路径处理测试', () => {
    it('应该正确处理 Windows 路径', () => {
      const testPath = 'E:\\project\\src\\config';
      const normalized = path.normalize(testPath);
      expect(normalized).toContain('E:');
      expect(normalized).not.toContain('E:\\E:');
    });

    it('应该正确处理 file:// URL 路径', () => {
      const fileUrl = 'file:///E:/project/src/config/settings.json';
      // 模拟 fileURLToPath 的行为
      const expected = 'E:\\project\\src\\config\\settings.json';
      const result = fileUrl.replace('file:///', '').replace(/\//g, '\\');
      expect(result).toBe(expected);
    });

    it('process.cwd() 应该返回有效路径', () => {
      const cwd = process.cwd();
      expect(cwd).toBeDefined();
      expect(typeof cwd).toBe('string');
      expect(cwd.length).toBeGreaterThan(0);
    });

    it('path.join 不应该产生重复盘符', () => {
      const base = 'E:\\project';
      const sub = 'src\\config';
      const result = path.join(base, sub);
      expect(result).not.toContain('E:\\E:');
      expect(result).toBe('E:\\project\\src\\config');
    });
  });

  describe('重构结构验证', () => {
    it('所有 handler 文件应该存在', async () => {
      const fs = await import('fs');
      const handlersDir = path.join(process.cwd(), 'electron/ipc-handlers');
      
      const requiredFiles = [
        'system-handlers.js',
        'config-handlers.js',
        'ai-handlers.js',
        'feishu-handlers.js',
        'install-handlers.js',
        'utils-handlers.js',
        'index.js',
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(handlersDir, file);
        expect(fs.existsSync(filePath), `${file} 应该存在`).toBe(true);
      }
    });

    it('index.js 应该导出所有必要的处理器', async () => {
      const indexPath = path.join(process.cwd(), 'electron/ipc-handlers/index.js');
      const content = await import('fs').then(fs => fs.readFileSync(indexPath, 'utf-8'));
      
      const requiredExports = [
        'registerSystemHandlers',
        'registerConfigHandlers',
        'registerAIHandlers',
        'registerFeishuHandlers',
        'registerInstallHandlers',
        'registerUtilsHandlers',
        'loadAppSettings',
        'getConfigPath',
      ];

      for (const exp of requiredExports) {
        // 支持 export { x } 或 export { x, y } 格式
        expect(content, `应该导出 ${exp}`).toMatch(new RegExp(`export\\s*\\{[^}]*\\b${exp}\\b`));
      }
    });

    it('config-handlers.js 应该使用 process.cwd() 而不是 import.meta.url', async () => {
      const configPath = path.join(process.cwd(), 'electron/ipc-handlers/config-handlers.js');
      const content = await import('fs').then(fs => fs.readFileSync(configPath, 'utf-8'));
      
      // 验证修复后的路径处理
      expect(content).toContain('process.cwd()');
      expect(content).not.toContain('new URL(import.meta.url)');
    });
  });

  describe('代码质量检查', () => {
    it('不应该有 console.log 残留（除了必要的日志）', async () => {
      const handlersDir = path.join(process.cwd(), 'electron/ipc-handlers');
      const fs = await import('fs');
      
      const files = fs.readdirSync(handlersDir).filter(f => f.endsWith('.js'));
      
      for (const file of files) {
        const content = fs.readFileSync(path.join(handlersDir, file), 'utf-8');
        const consoleLogCount = (content.match(/console\.log/g) || []).length;
        // 允许必要的日志，但不应该过多
        expect(consoleLogCount, `${file} 不应该有过多的 console.log`).toBeLessThan(10);
      }
    });

    it('所有 handlers 应该正确导入 electron', async () => {
      const handlersDir = path.join(process.cwd(), 'electron/ipc-handlers');
      const fs = await import('fs');
      
      const files = fs.readdirSync(handlersDir)
        .filter(f => f.endsWith('.js') && f !== 'index.js');
      
      for (const file of files) {
        const content = fs.readFileSync(path.join(handlersDir, file), 'utf-8');
        // 检查是否从 electron 导入（排除 ipcMain 作为参数传入的情况）
        // 检查是否使用了 electron 的 API 但没有导入
        const usesElectronApi = /\b(app|BrowserWindow|shell|dialog)\b/.test(content);
        const importsElectron = /from ['"]electron['"]/.test(content);
        
        if (usesElectronApi) {
          expect(importsElectron, `${file} 使用了 electron API 但没有导入`).toBe(true);
        }
      }
    });
  });
});

describe('重构完整性测试', () => {
  it('main.js 应该正确导入所有 handlers', async () => {
    const mainPath = path.join(process.cwd(), 'electron/main.js');
    const fs = await import('fs');
    const content = fs.readFileSync(mainPath, 'utf-8');
    
    const requiredImports = [
      'registerSystemHandlers',
      'registerConfigHandlers',
      'registerAIHandlers',
      'registerFeishuHandlers',
      'registerInstallHandlers',
      'registerUtilsHandlers',
      'loadAppSettings',
    ];

    for (const imp of requiredImports) {
      expect(content, `main.js 应该导入 ${imp}`).toContain(imp);
    }
  });

  it('不应该有重复导入', async () => {
    const handlersDir = path.join(process.cwd(), 'electron/ipc-handlers');
    const fs = await import('fs');
    
    const files = fs.readdirSync(handlersDir).filter(f => f.endsWith('.js'));
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(handlersDir, file), 'utf-8');
      const importMatches = content.match(/from ['"][^'"]+['"]/g) || [];
      const uniqueImports = [...new Set(importMatches)];
      
      expect(importMatches.length, `${file} 不应该有重复导入`).toBe(uniqueImports.length);
    }
  });
});
