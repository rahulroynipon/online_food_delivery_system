import * as React from 'react';
import { Switch as SwitchPrimitive } from 'radix-ui';

export type SwitchSize = 'sm' | 'md' | 'lg';
export type SwitchColor = 'primary' | 'success' | 'warning' | 'danger';

export interface SwitchProps extends Omit<
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
  'size' | 'color'
> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  loading?: boolean;
  size?: SwitchSize;
  color?: SwitchColor;
}
