import type { ButtonHTMLAttributes, ReactNode } from 'react';
import * as React from 'react';

export type DropdownItem = {
  key: React.Key;
  type?: never;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  closeOnClick?: boolean;
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

export interface DropdownSeparator {
  type: 'separator' | 'divider';
  key?: React.Key;
}

export interface DropdownLabel {
  type: 'label' | 'header';
  key?: React.Key;
  label: React.ReactNode;
}

export interface DropdownSubmenu {
  key: React.Key;
  type?: never;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  children: DropdownItemType[];
}

export type DropdownItemType = DropdownItem | DropdownSeparator | DropdownLabel | DropdownSubmenu;

export interface DropdownMenuConfig {
  items: DropdownItemType[];
  side?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
  width?: number | string | 'trigger';
}

export interface DropdownProps {
  children: ReactNode;
  menu?: DropdownMenuConfig;
  className?: string;
  style?: React.CSSProperties;
}

export interface DropdownTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export interface DropdownMenuProps {
  children: ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
  width?: number | string | 'trigger';
}

export interface DropdownItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'content'
> {
  icon?: ReactNode;
  iconSize?: number;
  variant?: 'default' | 'danger';
  closeOnClick?: boolean;
  description?: ReactNode;
  content?: ReactNode;
  shortcut?: ReactNode;
}

export interface DropdownHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface DropdownSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface DropdownGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface DropdownLabelProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}
