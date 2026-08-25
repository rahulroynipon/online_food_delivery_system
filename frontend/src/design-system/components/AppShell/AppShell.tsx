'use client';

import * as React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '../../utils/utils';
import { Button } from '../Button';
import type {
  AppShellContextValue,
  AppShellProps,
  ContentProps,
  HeaderProps,
  MainProps,
  SidebarProps,
  SidebarTriggerProps,
} from './appShell.types';
import './appShell.css';

const AppShellContext = createContext<AppShellContextValue | null>(null);

export const useAppShell = () => {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error('AppShell subcomponents must be used inside <AppShell> wrapper.');
  }
  return context;
};

export const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  (
    {
      children,
      sidebarWidth = 256,
      collapsedWidth = 64,
      mobileBreakpoint = 'md',
      defaultCollapsed = false,
      desktopBehavior = 'collapse',
      className,
      style,
      ...props
    },
    ref
  ) => {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const toggleSidebar = useCallback(() => {
      if (desktopBehavior === 'overlay' && !isMobile) {
        setDrawerOpen((v) => !v);
      } else {
        setCollapsed((v) => !v);
      }
    }, [desktopBehavior, isMobile]);

    const openSidebar = useCallback(() => {
      if (desktopBehavior === 'overlay' && !isMobile) setDrawerOpen(true);
      else setCollapsed(false);
    }, [desktopBehavior, isMobile]);

    const closeSidebar = useCallback(() => {
      if (desktopBehavior === 'overlay' && !isMobile) setDrawerOpen(false);
      else setCollapsed(true);
    }, [desktopBehavior, isMobile]);

    const openDrawer = useCallback(() => setDrawerOpen(true), []);
    const closeDrawer = useCallback(() => setDrawerOpen(false), []);

    useEffect(() => {
      const getBreakpointWidth = () => {
        switch (mobileBreakpoint) {
          case 'sm':
            return 640;
          case 'lg':
            return 1024;
          case 'md':
          default:
            return 768;
        }
      };

      const checkMobile = () => {
        const mobile = window.innerWidth < getBreakpointWidth();
        setIsMobile(mobile);
        if (!mobile) {
          setDrawerOpen(false);
        }
      };

      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, [mobileBreakpoint]);

    const contextValue: AppShellContextValue = {
      collapsed,
      toggleSidebar,
      openSidebar,
      closeSidebar,
      drawerOpen,
      openDrawer,
      closeDrawer,
      isMobile,
      desktopBehavior,
    };

    const cssVariables = {
      '--appshell-sidebar-width': `${sidebarWidth}px`,
      '--appshell-collapsed-width': `${collapsedWidth}px`,
      ...style,
    } as React.CSSProperties;

    return (
      <AppShellContext.Provider value={contextValue}>
        <div ref={ref} className={cn('appshell-root', className)} style={cssVariables} {...props}>
          {children}
        </div>
      </AppShellContext.Provider>
    );
  }
);
AppShell.displayName = 'AppShell';

// ── Sidebar Component ────────────────────────────────────────────────────────
export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ children, variant = 'default', collapsible = true, className, ...props }, ref) => {
    const { collapsed, isMobile, drawerOpen, closeDrawer, desktopBehavior } = useAppShell();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    // Escape listener to close drawer (mobile OR desktop overlay)
    useEffect(() => {
      const isOverlayMode = isMobile || desktopBehavior === 'overlay';
      if (!isOverlayMode || !drawerOpen) return;
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeDrawer();
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }, [isMobile, drawerOpen, closeDrawer, desktopBehavior]);

    if (!mounted) return null;

    // Desktop overlay mode — same drawer/portal behavior as mobile
    const useDrawer = isMobile || desktopBehavior === 'overlay';

    const sidebarClass = cn(
      'appshell-sidebar flex flex-col h-full',
      variant === 'floating' && 'appshell-sidebar-floating',
      variant === 'inset' && 'appshell-sidebar-inset',
      collapsed && collapsible && !isMobile && desktopBehavior === 'collapse' && 'is-collapsed',
      className
    );

    if (useDrawer) {
      return createPortal(
        <>
          {/* Backdrop Overlay */}
          {drawerOpen && (
            <div className="appshell-drawer-overlay" onClick={closeDrawer} aria-hidden="true" />
          )}
          {/* Drawer Panel */}
          <div
            ref={ref}
            className={cn('appshell-drawer', !drawerOpen && 'is-closed', className)}
            role="dialog"
            aria-modal="true"
            {...props}
          >
            {children}
          </div>
        </>,
        document.body
      );
    }

    return (
      <div ref={ref} className={sidebarClass} {...props}>
        {children}
      </div>
    );
  }
);
Sidebar.displayName = 'Sidebar';

// ── Sidebar Trigger ─────────────────────────────────────────────────────────
export const SidebarTrigger = React.forwardRef<HTMLButtonElement, SidebarTriggerProps>(
  (
    {
      className,
      onClick,
      children,
      variant = 'ghost',
      size = 'icon-xs',
      rounded = 'full',
      ...props
    },
    ref
  ) => {
    const { isMobile, toggleSidebar, drawerOpen, openDrawer, closeDrawer } = useAppShell();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (isMobile) {
        if (drawerOpen) {
          closeDrawer();
        } else {
          openDrawer();
        }
      } else {
        toggleSidebar();
      }
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        rounded={rounded}
        onClick={handleClick}
        className={cn(
          'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
          className
        )}
        {...props}
      >
        {children ?? (isMobile && drawerOpen ? <X size={18} /> : <Menu size={18} />)}
      </Button>
    );
  }
);
SidebarTrigger.displayName = 'SidebarTrigger';

// ── Header Component ──────────────────────────────────────────────────────────
export const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ children, className, fixed = true, ...props }, ref) => (
    <header ref={ref} className={cn('appshell-header', fixed && 'is-fixed', className)} {...props}>
      {children}
    </header>
  )
);
Header.displayName = 'Header';

// ── Main Content Offset Container ─────────────────────────────────────────────
export const Main = React.forwardRef<HTMLDivElement, MainProps>(
  ({ children, className, ...props }, ref) => {
    const { collapsed, isMobile, desktopBehavior } = useAppShell();

    // In overlay mode, sidebar floats OVER the content — no left offset needed
    const isOverlay = desktopBehavior === 'overlay';

    return (
      <main
        ref={ref}
        className={cn(
          'appshell-main',
          !isOverlay && 'has-sidebar',
          !isOverlay && collapsed && !isMobile && 'is-collapsed',
          className
        )}
        {...props}
      >
        {children}
      </main>
    );
  }
);
Main.displayName = 'Main';

// ── Content Layout Component ──────────────────────────────────────────────────
export const Content = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('appshell-content', className)} {...props}>
      {children}
    </div>
  )
);
Content.displayName = 'Content';
