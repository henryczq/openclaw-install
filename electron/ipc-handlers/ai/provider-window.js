import { BrowserWindow } from 'electron';

const RPA_BOOTSTRAP = `
  (() => {
    window.RPA = window.RPA || {
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      isVisible: (element) => {
        try {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return (
            rect.width > 0
            && rect.height > 0
            && style.display !== 'none'
            && style.visibility !== 'hidden'
            && style.opacity !== '0'
          );
        } catch (_) {
          return false;
        }
      }
    };
  })();
`;

export function createAutomationWindowManager({
  title,
  width = 1200,
  height = 800
}) {
  let providerWindow = null;

  const ensureWindow = () => {
    if (providerWindow && !providerWindow.isDestroyed()) {
      return providerWindow;
    }

    providerWindow = new BrowserWindow({
      width,
      height,
      title,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    return providerWindow;
  };

  const inject = async (script) => {
    const windowInstance = ensureWindow();
    return windowInstance.webContents.executeJavaScript(`
      ${RPA_BOOTSTRAP}
      ${script}
    `);
  };

  const closeWindow = () => {
    if (providerWindow && !providerWindow.isDestroyed()) {
      providerWindow.close();
      providerWindow = null;
    }
  };

  return {
    ensureWindow,
    inject,
    closeWindow
  };
}
