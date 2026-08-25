import * as React from 'react';

export type RadioGroupOrientation = 'horizontal' | 'vertical';
export type RadioGroupSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

export interface RadioProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string;
  checked?: boolean;
}

export interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  orientation?: RadioGroupOrientation;
  size?: RadioGroupSize;
  fullWidth?: boolean;
  ripple?: boolean;
  className?: string;
  children?: React.ReactNode;
  name?: string;
  id?: string;
}

export interface RadioItemProps {
  value: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}
