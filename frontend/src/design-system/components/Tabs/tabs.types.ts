import * as React from 'react';

export interface TabItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'value' | 'onChange'
> {
  value: string;
  onValueChange: (value: string) => void;
  items?: TabItem[];
  variant?: 'line' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  children?: React.ReactNode;
  activeIndicatorClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  activeIndicatorClassName?: string;
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  activeClassName?: string;
  inactiveClassName?: string;
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children?: React.ReactNode;
}
