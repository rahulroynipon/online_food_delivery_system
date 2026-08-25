import * as React from 'react';

export interface AppShellContextValue {
  collapsed: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  isMobile: boolean;
  /** Whether desktop also uses overlay/drawer mode instead of push-collapse */
  desktopBehavior: 'collapse' | 'overlay';
}

export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  sidebarWidth?: number;
  collapsedWidth?: number;
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  defaultCollapsed?: boolean;
  /**
   * Controls desktop sidebar behavior:
   * - "collapse" (default) → sidebar shrinks to icon-only when closed
   * - "overlay" → sidebar slides over content like a mobile drawer
   */
  desktopBehavior?: 'collapse' | 'overlay';
}

import type { ButtonProps } from '../Button/button.types';

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'floating' | 'inset';
  collapsible?: boolean;
}

export interface SidebarTriggerProps extends ButtonProps {}

export interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  fixed?: boolean;
}

export interface MainProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface ContentProps extends React.HTMLAttributes<HTMLDivElement> {}
