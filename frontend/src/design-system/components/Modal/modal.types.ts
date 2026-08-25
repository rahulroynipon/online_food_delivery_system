import * as React from 'react';

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onClose?: () => void;
  title?: string; // Optional for backward compatibility
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  accentColor?: string;
}

export interface ModalTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export interface ModalCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export interface ModalPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  accentColor?: string;
}

export interface ModalHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  children?: React.ReactNode;
  showClose?: boolean;
  showInfo?: boolean;
  onInfoClick?: () => void;
  action?: React.ReactNode;
  accentColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | string;
  showSeparator?: boolean;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  showSeparator?: boolean;
}
