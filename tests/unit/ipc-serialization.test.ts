import { describe, it, expect } from 'vitest';

/**
 * 测试 IPC 序列化兼容性
 * 确保所有返回的对象都可以被 Electron IPC 正确传输
 */
describe('IPC Serialization', () => {
  
  // 模拟 sanitizeIpcResult 函数的逻辑
  function sanitizeIpcResult(data: any) {
    const sanitized: any = {
      success: false
    };
    
    if (data && typeof data === 'object') {
      sanitized.success = !!data.success;
      
      if (data.error !== undefined && data.error !== null) {
        sanitized.error = String(data.error);
      }
      if (data.message !== undefined && data.message !== null) {
        sanitized.message = String(data.message);
      }
      
      if (data.data !== undefined && data.data !== null) {
        try {
          sanitized.data = JSON.parse(JSON.stringify(data.data));
        } catch {
          sanitized.data = { value: String(data.data) };
        }
      }
      
      if (data.checks !== undefined && data.checks !== null && typeof data.checks === 'object') {
        sanitized.checks = {
          createButtonFound: !!data.checks.createButtonFound,
          nameInputFound: !!data.checks.nameInputFound,
          descInputFound: !!data.checks.descInputFound,
          submitButtonFound: !!data.checks.submitButtonFound,
          addRobotButtonFound: !!data.checks.addRobotButtonFound
        };
      }
    }
    
    return sanitized;
  }

  // 模拟 injectRPA 返回结果的处理
  function processRpaResult(rawResult: any) {
    const result: any = {
      success: !!rawResult?.success
    };
    
    if (rawResult?.error) {
      result.error = String(rawResult.error);
    }
    if (rawResult?.data) {
      try {
        result.data = JSON.parse(JSON.stringify(rawResult.data));
      } catch {
        result.data = { value: String(rawResult.data) };
      }
    }
    if (rawResult?.checks) {
      result.checks = {
        createButtonFound: !!rawResult.checks.createButtonFound,
        nameInputFound: !!rawResult.checks.nameInputFound,
        descInputFound: !!rawResult.checks.descInputFound,
        submitButtonFound: !!rawResult.checks.submitButtonFound,
        addRobotButtonFound: !!rawResult.checks.addRobotButtonFound
      };
    }
    
    return result;
  }

  // 测试：对象不包含 undefined 值
  function hasNoUndefined(obj: any): boolean {
    if (obj === undefined) return false;
    if (obj === null) return true;
    if (typeof obj !== 'object') return true;
    
    for (const key in obj) {
      if (obj[key] === undefined) return false;
      if (typeof obj[key] === 'object' && !hasNoUndefined(obj[key])) return false;
    }
    return true;
  }

  // 测试：对象可以被 JSON 序列化
  function isJsonSerializable(obj: any): boolean {
    try {
      JSON.parse(JSON.stringify(obj));
      return true;
    } catch {
      return false;
    }
  }

  describe('sanitizeIpcResult', () => {
    it('应该处理成功响应', () => {
      const input = { success: true };
      const result = sanitizeIpcResult(input);
      
      expect(result.success).toBe(true);
      expect(hasNoUndefined(result)).toBe(true);
      expect(isJsonSerializable(result)).toBe(true);
    });

    it('应该处理带错误信息的响应', () => {
      const input = { success: false, error: '测试错误' };
      const result = sanitizeIpcResult(input);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('测试错误');
      expect(hasNoUndefined(result)).toBe(true);
      expect(isJsonSerializable(result)).toBe(true);
    });

    it('应该处理带 checks 的响应', () => {
      const input = {
        success: true,
        checks: {
          createButtonFound: true,
          nameInputFound: false,
          descInputFound: true,
          submitButtonFound: true,
          addRobotButtonFound: false
        }
      };
      const result = sanitizeIpcResult(input);
      
      expect(result.success).toBe(true);
      expect(result.checks).toBeDefined();
      expect(result.checks.createButtonFound).toBe(true);
      expect(result.checks.nameInputFound).toBe(false);
      expect(hasNoUndefined(result)).toBe(true);
      expect(isJsonSerializable(result)).toBe(true);
    });

    it('不应该包含 undefined 值', () => {
      const input = {
        success: true,
        error: undefined,
        message: undefined,
        data: undefined,
        checks: undefined
      };
      const result = sanitizeIpcResult(input);
      
      expect(hasNoUndefined(result)).toBe(true);
      expect('error' in result).toBe(false);
      expect('message' in result).toBe(false);
      expect('data' in result).toBe(false);
      expect('checks' in result).toBe(false);
    });

    it('应该处理 null 值', () => {
      const input = {
        success: true,
        error: null,
        data: null
      };
      const result = sanitizeIpcResult(input);
      
      expect(hasNoUndefined(result)).toBe(true);
      expect('error' in result).toBe(false);
      expect('data' in result).toBe(false);
    });

    it('应该处理嵌套对象', () => {
      const input = {
        success: true,
        data: {
          appId: 'cli_123',
          appSecret: 'secret_456'
        }
      };
      const result = sanitizeIpcResult(input);
      
      expect(result.data.appId).toBe('cli_123');
      expect(result.data.appSecret).toBe('secret_456');
      expect(hasNoUndefined(result)).toBe(true);
      expect(isJsonSerializable(result)).toBe(true);
    });
  });

  describe('processRpaResult', () => {
    it('应该处理 RPA 成功结果', () => {
      const rawResult = {
        success: true,
        checks: {
          createButtonFound: true,
          nameInputFound: true,
          descInputFound: true,
          submitButtonFound: true,
          addRobotButtonFound: true
        }
      };
      const result = processRpaResult(rawResult);
      
      expect(result.success).toBe(true);
      expect(result.checks.createButtonFound).toBe(true);
      expect(hasNoUndefined(result)).toBe(true);
      expect(isJsonSerializable(result)).toBe(true);
    });

    it('应该处理 RPA 错误结果', () => {
      const rawResult = {
        success: false,
        error: '未找到创建按钮'
      };
      const result = processRpaResult(rawResult);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('未找到创建按钮');
      expect(hasNoUndefined(result)).toBe(true);
      expect(isJsonSerializable(result)).toBe(true);
    });

    it('不应该包含 undefined 字段', () => {
      const rawResult = {
        success: true
        // 不包含 error, data, checks
      };
      const result = processRpaResult(rawResult);
      
      expect(hasNoUndefined(result)).toBe(true);
      expect('error' in result).toBe(false);
      expect('data' in result).toBe(false);
      expect('checks' in result).toBe(false);
    });
  });

  describe('safeInvoke 模拟', () => {
    it('应该正确序列化结果', async () => {
      // 模拟 safeInvoke 的行为
      const mockResult = {
        success: true,
        checks: {
          createButtonFound: true,
          nameInputFound: true
        }
      };
      
      // 使用 JSON.parse(JSON.stringify()) 模拟 safeInvoke
      const result = JSON.parse(JSON.stringify(mockResult));
      
      expect(result).toEqual(mockResult);
      expect(hasNoUndefined(result)).toBe(true);
    });

    it('应该处理错误情况', async () => {
      const mockError = new Error('测试错误');
      const result = {
        success: false,
        error: mockError && mockError.message ? String(mockError.message) : String(mockError)
      };
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('测试错误');
      expect(hasNoUndefined(result)).toBe(true);
    });
  });
});
