import * as React from 'react';

export type AlertLegacyVariant = 'info' | 'success' | 'warning' | 'error' | 'danger';

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'variant'> {
  title?: string;
  closable?: boolean;
  action?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  animated?: boolean;
  autoClose?: boolean;
  duration?: number;
  pauseOnHover?: boolean;
  showProgress?: boolean;
  onClose?: () => void;
  icon?: React.ReactNode;
  variant?: 'soft' | 'filled' | 'outline' | AlertLegacyVariant;
  severity?: 'info' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  keepMountedOnClose?: boolean;
}
