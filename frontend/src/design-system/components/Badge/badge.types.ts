import * as React from 'react';
import type { VariantProps } from 'class-variance-authority';
import { badgeVariants } from './badge.variants';

export type BadgeLegacyVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'error'
  | 'info'
  | 'neutral';

export interface BadgeProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, 'color' | 'content'>,
    Omit<VariantProps<typeof badgeVariants>, 'variant' | 'color'> {
  children?: React.ReactNode;
  variant?: 'solid' | 'soft' | 'outline' | BadgeLegacyVariant;
  color?:
    'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'xs' | 'sm' | 'md' | 'lg';

  // Notification features
  content?: React.ReactNode;
  max?: number;
  showZero?: boolean;

  // Dot feature
  dot?: boolean;

  // Placement (when wrapping children)
  placement?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

  // Actions & Effects
  pulse?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}
