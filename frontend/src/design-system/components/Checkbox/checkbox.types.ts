import * as React from 'react';

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'onChange' | 'checked' | 'defaultChecked' | 'value'
> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
  value?: string;
  isGroupParent?: boolean;
  ignoreGroup?: boolean;
}

export interface CheckboxGroupItem {
  id: string;
  label: string;
  description?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  name?: string;
  label?: string;
  description?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  items?: CheckboxGroupItem[];
  checkedIds?: Set<string>;
  onCheckedIdsChange?: (ids: Set<string>) => void;
  defaultCheckedIds?: Set<string>;
  children?: React.ReactNode;
}
