import { createAutomationWindowManager } from './provider-window.js';

const automation = createAutomationWindowManager({
  title: 'KIMI 开发者平台'
});

export function registerKimiApiKeyHandler(ipcMain) {
  ipcMain.handle('get-kimi-apikey', async () => {
    try {
      const windowInstance = automation.ensureWindow();
      const url = 'https://platform.moonshot.cn/console/api-keys';
      await windowInstance.loadURL(url);
      windowInstance.show();

      const result = await automation.inject(`
        (async () => {
          const sleep = window.RPA.sleep;
          const normalizeText = (value) => String(value || '').replace(/\\s+/g, ' ').trim();
          const comparableText = (value) => normalizeText(value).replace(/\\s+/g, '');
          const waitFor = async (getter, timeout = 5000, interval = 200) => {
            const endTime = Date.now() + timeout;
            while (Date.now() < endTime) {
              const value = getter();
              if (value) return value;
              await sleep(interval);
            }
            return null;
          };
          const findButton = (...texts) => {
            const expectedTexts = texts.map((text) => comparableText(text));
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find((button) => (
              window.RPA.isVisible(button)
              && expectedTexts.includes(comparableText(button.textContent))
            )) || null;
          };
          const clickElement = (element) => {
            if (!element) return false;
            try {
              element.scrollIntoView({ block: 'center' });
              element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
              element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
              element.click();
              return true;
            } catch (_) {
              return false;
            }
          };
          const setInputValue = async (input, value, retryCount = 3) => {
            if (!input) return false;

            const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
            const nativeSetter = descriptor && typeof descriptor.set === 'function'
              ? descriptor.set
              : null;

            for (let index = 0; index < retryCount; index += 1) {
              try {
                input.focus();
                if (typeof input.select === 'function') {
                  input.select();
                }

                if (nativeSetter) nativeSetter.call(input, '');
                else input.value = '';

                input.dispatchEvent(new InputEvent('input', {
                  bubbles: true,
                  cancelable: true,
                  data: '',
                  inputType: 'deleteContentBackward'
                }));

                if (nativeSetter) nativeSetter.call(input, value);
                else input.value = value;

                input.dispatchEvent(new InputEvent('input', {
                  bubbles: true,
                  cancelable: true,
                  data: value,
                  inputType: 'insertText'
                }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('blur', { bubbles: true }));
              } catch (_) {}

              await sleep(120);
              if (normalizeText(input.value) === value) {
                return true;
              }
            }

            return normalizeText(input.value) === value;
          };

          await sleep(1500);

          const createButton = await waitFor(
            () => findButton('新建 API Key', '创建 API Key'),
            8000
          );
          const clickedCreate = clickElement(createButton);

          // 等待弹窗出现
          await sleep(800);

          const modal = await waitFor(() => (
            Array.from(document.querySelectorAll('div[role="dialog"].ant-modal'))
              .find((element) => (
                window.RPA.isVisible(element)
                && comparableText(element.querySelector('.ant-modal-title')?.textContent).includes(comparableText('新建 API Key'))
              ))
          ), 5000);

          const projectSelect = await waitFor(() => {
            if (!modal) return null;
            return Array.from(modal.querySelectorAll('.ant-select')).find((select) => {
              const placeholder = comparableText(
                select.querySelector('.ant-select-selection-placeholder')?.textContent
              );
              return placeholder.includes(comparableText('选择 API Key 所属项目'));
            }) || null;
          }, 3000);

          const readSelectedProject = () => comparableText(
            projectSelect?.querySelector('.ant-select-selection-item')?.textContent
              || projectSelect?.querySelector('.ant-select-selection-placeholder')?.textContent
          );

          let projectDropdownOpened = false;
          let projectListId = '';
          let selectedProject = '';
          let clickedProject = false;

          if (projectSelect) {
            const projectInput = projectSelect.querySelector('input.ant-select-selection-search-input[role="combobox"]');
            const projectSelector = projectSelect.querySelector('.ant-select-selector') || projectSelect;
            const projectArrow = projectSelect.querySelector('.ant-select-arrow');

            projectListId = projectInput?.getAttribute('aria-controls')
              || projectInput?.getAttribute('aria-owns')
              || '';

            for (let attempt = 0; attempt < 3; attempt += 1) {
              projectDropdownOpened = (
                clickElement(projectInput)
                || clickElement(projectSelector)
                || clickElement(projectArrow)
                || projectDropdownOpened
              );

              const projectDropdown = await waitFor(() => {
                if (!projectListId) return null;
                const escapedListId = (window.CSS && typeof window.CSS.escape === 'function')
                  ? window.CSS.escape(projectListId)
                  : projectListId.replace(/([ #;?%&,.+*~\\\\':"!^$\\[\\]()=>|/])/g, '\\\\$1');
                const dropdown = document.querySelector('#' + escapedListId);
                return dropdown && window.RPA.isVisible(dropdown) ? dropdown : null;
              }, 3000, 150);

              const defaultOption = await waitFor(() => {
                const optionContents = Array.from((projectDropdown || document).querySelectorAll('.ant-select-item-option-content'))
                  .filter((option) => window.RPA.isVisible(option));

                const preferredOption = optionContents.find((option) => {
                  const text = comparableText(option.textContent);
                  return text === comparableText('default') || text === comparableText('默认');
                });

                return preferredOption || optionContents[0] || null;
              }, 3000, 150);

              clickedProject = clickElement(defaultOption)
                || clickElement(defaultOption?.closest('.ant-select-item-option'))
                || clickedProject;

              await sleep(250);
              selectedProject = readSelectedProject();
              if (selectedProject === comparableText('default') || selectedProject === comparableText('默认')) {
                break;
              }
            }
          }

          await sleep(300);

          const nameInput = await waitFor(() => (
            modal ? modal.querySelector('input.ant-input[maxlength="32"]') : null
          ), 3000);
          const filledName = await setInputValue(nameInput, 'openclaw-key');

          const modalTitle = modal?.querySelector('.ant-modal-title') || modal;
          clickElement(modalTitle);
          await sleep(300);

          const currentNameValue = normalizeText(nameInput?.value);
          const filledNameAfterProject = currentNameValue === 'openclaw-key'
            ? true
            : await setInputValue(nameInput, 'openclaw-key');

          const confirmButton = await waitFor(() => {
            const button = findButton('确定');
            return button && !button.disabled ? button : null;
          }, 5000, 200);

          if (!confirmButton) {
            return {
              success: false,
              error: '未找到确定按钮'
            };
          }

          const clickedConfirm = clickElement(confirmButton);

          if (!clickedConfirm) {
            return {
              success: false,
              error: '点击确定按钮失败'
            };
          }

          // 等待弹窗切换到显示密钥的状态
          await sleep(1200);

          // 从弹窗中查找密钥输入框
          const keyModal = await waitFor(() => (
            Array.from(document.querySelectorAll('div[role="dialog"].ant-modal'))
              .find((element) => (
                window.RPA.isVisible(element)
                && (comparableText(element.querySelector('.ant-modal-title')?.textContent).includes(comparableText('您的密钥'))
                    || comparableText(element.querySelector('.ant-modal-title')?.textContent).includes(comparableText('密钥')))
              ))
          ), 8000);

          const keyInput = await waitFor(() => {
            if (!keyModal) return null;
            // 从弹窗内查找readonly的input,并且value以sk-开头
            return Array.from(keyModal.querySelectorAll('input.ant-input[readonly]'))
              .find((input) => {
                const value = normalizeText(input.value);
                return (window.RPA.isVisible(input) || value) && value.startsWith('sk-');
              }) || null;
          }, 6000, 300);

          const key = keyInput ? normalizeText(keyInput.value) : '';

          // 如果找到了密钥,尝试点击复制按钮
          if (key && keyModal) {
            const copyButton = await waitFor(() => {
              const buttons = Array.from(keyModal.querySelectorAll('button.ant-btn-icon-only'));
              return buttons.find((btn) => (
                window.RPA.isVisible(btn)
                && btn.querySelector('span[aria-label="copy"]')
              )) || null;
            }, 2000);
            if (copyButton) {
              clickElement(copyButton);
              await sleep(500);
            }
          }

          return {
            success: true,
            closeWindow: !!key,
            data: {
              key,
              clickedCreate,
              projectDropdownOpened,
              clickedProject,
              selectedProject,
              filledName,
              filledNameAfterProject,
              nameValueAfterFill: normalizeText(nameInput?.value),
              clickedConfirm,
              createBtnFound: !!createButton,
              projectSelectFound: !!projectSelect,
              projectListId,
              confirmBtnFound: !!confirmButton
            }
          };
        })()
      `);

      const apiKey = result?.data?.key || '';
      const shouldClose = result?.closeWindow || false;

      if (apiKey) {
        // 成功获取到密钥后关闭窗口
        if (shouldClose) {
          automation.closeWindow();
        }
        return { success: true, apiKey };
      }

      return {
        success: true,
        apiKey: '',
        opened: true,
        message: '已打开控制台,请登录后点击”去 KIMI 获取”重试'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
