import * as React from 'react';

export type ToastSeverity = 'info' | 'success' | 'warning' | 'error';
export type ToastVariant = 'soft' | 'filled' | 'outline';
export type ToastPosition =
  'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';

export interface ToastOptions {
  title?: string;
  severity?: ToastSeverity;
  variant?: ToastVariant;
  duration?: number;
  closable?: boolean;
  action?: React.ReactNode;
  loading?: boolean;
  position?: ToastPosition;
}

export interface ToastItem extends ToastOptions {
  id: string;
  message: React.ReactNode;
  exiting?: boolean;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (message: React.ReactNode, options?: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  collapsible: boolean;
  setCollapsible: (value: boolean) => void;
}

export interface ToastProviderProps {
  children: React.ReactNode;
  collapsible?: boolean;
  defaultPosition?: ToastPosition;
  defaultDuration?: number;
  defaultVariant?: ToastVariant;
  defaultClosable?: boolean;
}
