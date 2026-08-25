import * as React from 'react';

export type MultiSelectDisplayMode = 'wrap' | 'compact';

export type SelectOption<T = string> = {
  value: T;
  disabled?: boolean;
} & (
  | {
      content: React.ReactNode;
      label: string;
      icon?: React.ReactNode;
      description?: React.ReactNode;
    }
  | {
      content?: never;
      label?: string;
      icon?: React.ReactNode;
      description?: React.ReactNode;
    }
);

export interface SelectProps<T = string> extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'defaultValue' | 'onChange' | 'size'
> {
  options?: SelectOption<T>[];
  value?: T | T[];
  defaultValue?: T | T[];
  onValueChange?: (value: any) => void;
  multiple?: boolean;
  displayMode?: MultiSelectDisplayMode;
  maxVisibleTags?: number | 'auto';
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  description?: string;
  error?: string;
  placeholder?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  required?: boolean;
  searchPlaceholder?: string;
  renderOption?: (option: SelectOption<T>) => React.ReactNode;
  className?: string;
  name?: string;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  sideOffset?: number;
  alignOffset?: number;
  width?: number | string | 'trigger';
  showArrow?: boolean;
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  sideOffset?: number;
  alignOffset?: number;
  side?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  align?: 'start' | 'center' | 'end';
  width?: number | string | 'trigger';
}

export interface SelectOptionProps<T = string> extends React.HTMLAttributes<HTMLDivElement> {
  value: T;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: React.ReactNode;
}
