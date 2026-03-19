import { createAutomationWindowManager } from './provider-window.js';

const automation = createAutomationWindowManager({
  title: '火山引擎控制台'
});

// 共享的RPA脚本工具函数
const RPA_UTILS = `
  const sleep = window.RPA.sleep;
  const byTextButton = (text) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find((button) => (
      window.RPA.isVisible(button)
      && String(button.textContent || '').trim() === text
    )) || null;
  };
  const clickElement = (element) => {
    if (!element) return false;
    try {
      element.scrollIntoView({ block: 'center' });
      // 只使用 dispatchEvent 触发点击，避免重复
      element.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
      return true;
    } catch (_) {
      return false;
    }
  };
`;

// 从现有KEY中获取（点击眼睛图标显示）
const GET_EXISTING_KEY_SCRIPT = `
  (async () => {
    const sleep = window.RPA.sleep;
    const byTextButton = (text) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((button) => (
        window.RPA.isVisible(button)
        && String(button.textContent || '').trim() === text
      )) || null;
    };
    const clickElement = (element) => {
      if (!element) return false;
      try {
        element.scrollIntoView({ block: 'center' });
        // 只使用 dispatchEvent 触发点击，避免重复
        element.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        return true;
      } catch (_) {
        return false;
      }
    };

    await sleep(2000);

    // 检查是否未登录（通过检查登录按钮或登录页面特征）
    const loginButton = byTextButton('登录') || byTextButton('立即登录') || document.querySelector('.login-btn, .login-button, [data-testid="login-btn"]');
    const currentUrl = window.location.href;
    const isLoginPage = currentUrl.includes('/login') || currentUrl.includes('/auth') || document.querySelector('.login-form, .login-container');
    
    if (loginButton || isLoginPage) {
      return {
        success: false,
        needLogin: true,
        message: '请先登录火山引擎账号'
      };
    }

    // 检查是否有"创建 API Key"按钮（说明已登录但可能没有Key）
    const createButton = byTextButton('创建 API Key');
    
    const existingKeys = document.querySelectorAll('.eye-icon-wrapper-mOiIUI .force-icon-eye, svg.force-icon-eye');
    if (existingKeys.length === 0) {
      // 如果已登录但没有Key
      if (createButton) {
        return {
          success: false,
          noKeys: true,
          message: '没有找到已有的API Key，请使用"去火山引擎创建"创建新的KEY'
        };
      }
      // 可能是页面还在加载中
      return {
        success: false,
        message: '页面加载中，请稍后重试'
      };
    }

    const firstEye = existingKeys[0];
    const clickedEye = clickElement(firstEye.closest('button') || firstEye.parentElement || firstEye);

    await sleep(800);

    const keyNode = document.querySelector('.key-show-wrapper-n7wX0X div');
    const key = keyNode ? String(keyNode.textContent || '').trim() : '';

    if (key) {
      return {
        success: true,
        data: { key, fromExisting: true }
      };
    }

    return {
      success: false,
      message: '无法读取API Key'
    };
  })()
`;

// 创建新KEY并获取
const CREATE_AND_GET_KEY_SCRIPT = `
  (async () => {
    const sleep = window.RPA.sleep;
    const byTextButton = (text) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((button) => (
        window.RPA.isVisible(button)
        && String(button.textContent || '').trim() === text
      )) || null;
    };
    const clickElement = (element) => {
      if (!element) return false;
      try {
        element.scrollIntoView({ block: 'center' });
        // 只使用 dispatchEvent 触发点击，避免重复
        element.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        return true;
      } catch (_) {
        return false;
      }
    };

    await sleep(1500);

    // 先检查是否已有现有的 KEY
    const createButton = byTextButton('创建 API Key');
    if (!createButton) {
      return {
        success: false,
        data: { createBtnFound: false }
      };
    }

    const clickedCreate = clickElement(createButton);
    if (!clickedCreate) {
      return {
        success: false,
        data: { clickedCreate: false }
      };
    }

    await sleep(800);

    const input = document.querySelector('#Name_input');
    if (input) {
      if (!input.value) input.value = 'api-key-' + Date.now();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const confirmButton = byTextButton('创建');
    const clickedConfirm = clickElement(confirmButton);

    await sleep(1200);

    const eye = document.querySelector('.eye-icon-wrapper-mOiIUI .force-icon-eye, svg.force-icon-eye');
    const clickedEye = clickElement(eye && (eye.closest('button') || eye.parentElement || eye));

    await sleep(800);

    const keyNode = document.querySelector('.key-show-wrapper-n7wX0X div');
    const key = keyNode ? String(keyNode.textContent || '').trim() : '';

    return {
      success: true,
      data: {
        key,
        clickedCreate,
        clickedConfirm,
        clickedEye,
        createBtnFound: !!createButton,
        confirmBtnFound: !!confirmButton
      }
    };
  })()
`;

export function registerVolcengineApiKeyHandler(ipcMain) {
  // 去火山引擎创建（会先尝试获取现有KEY，没有才创建）
  ipcMain.handle('get-volcengine-apikey', async () => {
    try {
      const windowInstance = automation.ensureWindow();
      const url = 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey?apikey=%7B%7D&projectName=default';
      await windowInstance.loadURL(url);
      windowInstance.show();

      const result = await automation.inject(CREATE_AND_GET_KEY_SCRIPT);

      const apiKey = result?.data?.key || '';
      if (apiKey) {
        automation.closeWindow();
        return { success: true, apiKey };
      }

      return {
        success: true,
        apiKey: '',
        opened: true,
        message: '已打开控制台，请登录后点击"去火山引擎获取"重试'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 去火山引擎获取（仅从现有KEY中获取，不创建）
  ipcMain.handle('fetch-volcengine-apikey', async () => {
    try {
      const windowInstance = automation.ensureWindow();
      const url = 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey?apikey=%7B%7D&projectName=default';
      await windowInstance.loadURL(url);
      windowInstance.show();

      const result = await automation.inject(GET_EXISTING_KEY_SCRIPT);

      // 如果需要登录，保持窗口打开
      if (result?.needLogin) {
        return {
          success: false,
          needLogin: true,
          message: '请先登录火山引擎账号，登录后请再次点击"去火山引擎获取"'
        };
      }

      if (result?.noKeys) {
        automation.closeWindow();
        return {
          success: false,
          noKeys: true,
          message: '没有找到已有的API Key，请使用"去火山引擎创建"创建新的KEY'
        };
      }

      const apiKey = result?.data?.key || '';
      if (apiKey) {
        automation.closeWindow();
        return { success: true, apiKey };
      }

      // 如果没有获取到KEY，保持窗口打开让用户登录
      return {
        success: false,
        apiKey: '',
        opened: true,
        message: '已打开控制台，请登录后重试'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
