import { notification, message, Modal } from 'antd';
import type { ArgsProps } from 'antd/es/notification';

/**
 * 显示成功提示
 * @param content 提示内容
 * @param duration 持续时间（秒）
 */
export function showSuccess(content: string, duration = 2) {
  message.success(content, duration);
}

/**
 * 显示错误提示
 * @param content 提示内容
 * @param duration 持续时间（秒）
 */
export function showError(content: string, duration = 4) {
  message.error(content, duration);
}

/**
 * 显示警告提示
 * @param content 提示内容
 * @param duration 持续时间（秒）
 */
export function showWarning(content: string, duration = 4) {
  message.warning(content, duration);
}

/**
 * 显示右上角通知
 * @param config 配置
 */
export function showNotification(config: ArgsProps) {
  notification.open({
    placement: 'topRight',
    duration: 4,
    ...config,
  });
}

/**
 * 显示警告通知
 * @param title 标题
 * @param description 描述
 */
export function showWarningNotification(title: string, description?: string) {
  notification.warning({
    message: title,
    description,
    placement: 'topRight',
    duration: 4,
  });
}

/**
 * 显示成功通知
 * @param title 标题
 * @param description 描述
 */
export function showSuccessNotification(title: string, description?: string) {
  notification.success({
    message: title,
    description,
    placement: 'topRight',
    duration: 3,
  });
}

/**
 * 显示确认对话框
 * @param title 标题
 * @param content 内容
 * @param onOk 确认回调
 * @param onCancel 取消回调
 */
export function showConfirm(
  title: string,
  content: string,
  onOk?: () => void,
  onCancel?: () => void
) {
  Modal.confirm({
    title,
    content,
    onOk,
    onCancel,
  });
}

/**
 * 显示警告对话框
 * @param title 标题
 * @param content 内容
 * @param onOk 确认回调
 */
export function showWarningModal(
  title: string,
  content: string,
  onOk?: () => void
) {
  Modal.warning({
    title,
    content,
    onOk,
  });
}
