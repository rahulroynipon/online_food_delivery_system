import { globalToastManager } from './ToastContext';
import type { ToastOptions } from './toast.types';

export const toast = {
  show: (message: React.ReactNode, options?: ToastOptions) => {
    return globalToastManager.addToast(message, options);
  },
  success: (message: React.ReactNode, options?: Omit<ToastOptions, 'severity'>) => {
    return globalToastManager.addToast(message, {
      ...options,
      severity: 'success',
    });
  },
  error: (message: React.ReactNode, options?: Omit<ToastOptions, 'severity'>) => {
    return globalToastManager.addToast(message, {
      ...options,
      severity: 'error',
    });
  },
  warning: (message: React.ReactNode, options?: Omit<ToastOptions, 'severity'>) => {
    return globalToastManager.addToast(message, {
      ...options,
      severity: 'warning',
    });
  },
  info: (message: React.ReactNode, options?: Omit<ToastOptions, 'severity'>) => {
    return globalToastManager.addToast(message, {
      ...options,
      severity: 'info',
    });
  },
  dismiss: (id: string) => {
    globalToastManager.removeToast(id);
  },
  clear: () => {
    globalToastManager.clearAll();
  },
};

export default toast;
