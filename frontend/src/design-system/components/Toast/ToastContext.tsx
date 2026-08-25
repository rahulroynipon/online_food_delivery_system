'use client';

import * as React from 'react';
import type { ToastContextValue, ToastItem, ToastOptions, ToastProviderProps } from './toast.types';
import Toaster from './Toaster';

export const ToastContext = React.createContext<ToastContextValue | null>(null);

let nextId = 0;
let globalAddToast: ((message: React.ReactNode, options?: ToastOptions) => string) | null = null;
let globalRemoveToast: ((id: string) => void) | null = null;
let globalClearAll: (() => void) | null = null;

/**
 * Global static interface manager for toast dispatching outside components.
 */
export const globalToastManager = {
  addToast: (message: React.ReactNode, options?: ToastOptions) => {
    if (globalAddToast) {
      return globalAddToast(message, options);
    }
    console.warn('ToastProvider is not mounted yet.');
    return '';
  },
  removeToast: (id: string) => {
    globalRemoveToast?.(id);
  },
  clearAll: () => {
    globalClearAll?.();
  },
};

export function ToastProvider({
  children,
  collapsible: defaultCollapsible = true,
  defaultPosition = 'top-right',
  defaultDuration = 4000,
  defaultVariant = 'soft',
  defaultClosable = true,
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [collapsible, setCollapsible] = React.useState(defaultCollapsible);

  React.useEffect(() => {
    setCollapsible(defaultCollapsible);
  }, [defaultCollapsible]);

  const addToast = React.useCallback(
    (message: React.ReactNode, options?: ToastOptions) => {
      const id = `toast-${++nextId}`;
      const merged: ToastOptions = {
        position: defaultPosition,
        duration: defaultDuration,
        variant: defaultVariant,
        closable: defaultClosable,
        ...options, // per-call options override globals
      };
      setToasts((prev) => [...prev, { id, message, ...merged }]);
      return id;
    },
    [defaultPosition, defaultDuration, defaultVariant, defaultClosable]
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 400);
  }, []);

  const clearAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  // Sync state helpers with global manager
  React.useEffect(() => {
    globalAddToast = addToast;
    globalRemoveToast = removeToast;
    globalClearAll = clearAll;
    return () => {
      globalAddToast = null;
      globalRemoveToast = null;
      globalClearAll = null;
    };
  }, [addToast, removeToast, clearAll]);

  const value = React.useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      clearAll,
      collapsible,
      setCollapsible,
    }),
    [toasts, addToast, removeToast, clearAll, collapsible]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        toasts={toasts}
        onRemove={removeToast}
        collapsible={collapsible}
        defaultPosition={defaultPosition}
        defaultDuration={defaultDuration}
        defaultClosable={defaultClosable}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
