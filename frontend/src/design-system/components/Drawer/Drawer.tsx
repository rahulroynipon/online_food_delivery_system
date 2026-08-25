'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/design-system/utils/utils';
import type {
  DrawerBodyProps,
  DrawerCloseProps,
  DrawerContentProps,
  DrawerDescriptionProps,
  DrawerFooterProps,
  DrawerHeaderProps,
  DrawerProps,
  DrawerSide,
  DrawerSize,
  DrawerTitleProps,
  DrawerTriggerProps,
  DrawerVariant,
} from './drawer.types';
import { drawerContentVariants, drawerOverlayVariants } from './drawer.variants';
import { Button } from '../Button';
import './drawer.css';

// Re-export types
export * from './drawer.types';

interface DrawerContextValue {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  side: DrawerSide;
  size: DrawerSize;
  variant: DrawerVariant;
}

const DrawerContext = React.createContext<DrawerContextValue | null>(null);

const useDrawerContext = () => {
  const context = React.useContext(DrawerContext);
  if (!context) {
    throw new Error('Drawer subcomponents must be used inside a <Drawer /> wrapper.');
  }
  return context;
};

// ── Breakpoint Detection Hook ────────────────────────────────────────────────
const useBreakpoint = () => {
  const [width, setWidth] = React.useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  return { isMobile, isTablet, isDesktop };
};

// ── Root Drawer Component ─────────────────────────────────────────────────────
export function Drawer({
  open: controlledOpen,
  onOpenChange,
  side = 'right',
  variant = 'temporary',
  size = 'md',
  responsive = false,
  defaultSide = 'right',
  children,
}: DrawerProps) {
  const [localOpen, setLocalOpen] = React.useState(false);
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : localOpen;

  const onOpen = React.useCallback(() => {
    if (!isControlled) setLocalOpen(true);
    onOpenChange?.(true);
  }, [isControlled, onOpenChange]);

  const onClose = React.useCallback(() => {
    if (!isControlled) setLocalOpen(false);
    onOpenChange?.(false);
  }, [isControlled, onOpenChange]);

  // Resolve responsive side configurations
  const resolvedSide = React.useMemo<DrawerSide>(() => {
    if (responsive) {
      return isMobile ? 'bottom' : defaultSide;
    }
    if (side && typeof side === 'object') {
      if (isMobile && side.mobile) return side.mobile;
      if (isTablet && side.tablet) return side.tablet;
      if (isDesktop && side.desktop) return side.desktop;
      return side.desktop || side.tablet || side.mobile || 'right';
    }
    return side as DrawerSide;
  }, [side, responsive, defaultSide, isMobile, isTablet, isDesktop]);

  // Handle ESC key to close (only for temporary/backdrop drawers)
  React.useEffect(() => {
    if (!open || variant !== 'temporary') return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, variant, onClose]);

  const contextValue = React.useMemo<DrawerContextValue>(
    () => ({
      open,
      onOpen,
      onClose,
      side: resolvedSide,
      size,
      variant,
    }),
    [open, onOpen, onClose, resolvedSide, size, variant]
  );

  return <DrawerContext.Provider value={contextValue}>{children}</DrawerContext.Provider>;
}
Drawer.displayName = 'Drawer';

// ── DrawerTrigger ────────────────────────────────────────────────────────────
export const Trigger = React.forwardRef<HTMLButtonElement, DrawerTriggerProps>(
  ({ children, asChild, onClick, ...props }, ref) => {
    const { onOpen } = useDrawerContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      onOpen();
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as any, {
        ref,
        onClick: (e: any) => {
          (children.props as any).onClick?.(e);
          onOpen();
        },
      });
    }

    return (
      <Button ref={ref} onClick={handleClick} {...props}>
        {children}
      </Button>
    );
  }
);
Trigger.displayName = 'DrawerTrigger';

// ── DrawerPortal ─────────────────────────────────────────────────────────────
export function Portal({ children }: { children: React.ReactNode }) {
  const { open } = useDrawerContext();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  return typeof document !== 'undefined' ? createPortal(children, document.body) : null;
}
Portal.displayName = 'DrawerPortal';

// ── DrawerOverlay ────────────────────────────────────────────────────────────
export function Overlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, onClose, variant } = useDrawerContext();

  if (variant !== 'temporary') return null;

  return (
    <div
      className={cn(drawerOverlayVariants({ open }), className)}
      onClick={onClose}
      aria-hidden="true"
      {...props}
    />
  );
}
Overlay.displayName = 'DrawerOverlay';

// ── DrawerContent ────────────────────────────────────────────────────────────
export const Content = React.forwardRef<HTMLDivElement, DrawerContentProps>(
  ({ children, className, style, ...props }, ref) => {
    const { open, side, size, variant, onClose } = useDrawerContext();
    const [mounted, setMounted] = React.useState(false);
    const [shouldRender, setShouldRender] = React.useState(open);
    const [animateShow, setAnimateShow] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    React.useEffect(() => {
      if (open) {
        setShouldRender(true);
        const timer = setTimeout(() => {
          setAnimateShow(true);
        }, 20);
        return () => clearTimeout(timer);
      } else {
        setAnimateShow(false);
        const timer = setTimeout(() => {
          setShouldRender(false);
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [open]);
    // Resolve size mapping classes & styles
    const { sizeClass, inlineStyle } = React.useMemo(() => {
      let resolvedSizeClass = '';
      let resolvedInlineStyle: React.CSSProperties = {};

      if (typeof size === 'number') {
        if (side === 'left' || side === 'right') {
          resolvedInlineStyle.width = `${size}px`;
        } else {
          resolvedInlineStyle.height = `${size}px`;
        }
      } else if (typeof size === 'string' && size.endsWith('%')) {
        if (side === 'left' || side === 'right') {
          resolvedInlineStyle.width = size;
        } else {
          resolvedInlineStyle.height = size;
        }
      } else {
        const sizeMap: Record<DrawerSide, Record<string, string>> = {
          left: {
            xs: 'w-64 max-w-full',
            sm: 'w-80 max-w-full',
            md: 'w-96 max-w-full',
            lg: 'w-[448px] max-w-full',
            xl: 'w-[576px] max-w-full',
            full: 'w-screen',
          },
          right: {
            xs: 'w-64 max-w-full',
            sm: 'w-80 max-w-full',
            md: 'w-96 max-w-full',
            lg: 'w-[448px] max-w-full',
            xl: 'w-[576px] max-w-full',
            full: 'w-screen',
          },
          top: {
            xs: 'h-48 max-h-full',
            sm: 'h-64 max-h-full',
            md: 'h-80 max-h-full',
            lg: 'h-96 max-h-full',
            xl: 'h-[450px] max-h-full',
            full: 'h-screen',
          },
          bottom: {
            xs: 'h-48 max-h-full',
            sm: 'h-64 max-h-full',
            md: 'h-80 max-h-full',
            lg: 'h-96 max-h-full',
            xl: 'h-[450px] max-h-full',
            full: 'h-[85vh]', // Bottom sheet default max-height
          },
        };

        resolvedSizeClass =
          sizeMap[side]?.[size as string] ||
          (side === 'left' || side === 'right' ? 'w-96 max-w-full' : 'h-80 max-h-full');
      }

      return { sizeClass: resolvedSizeClass, inlineStyle: resolvedInlineStyle };
    }, [side, size]);

    const resolvedStyle = { ...style, ...inlineStyle };

    if (!shouldRender || !mounted) return null;

    const contentEl = (
      <>
        {variant === 'temporary' && (
          <div
            className={cn(drawerOverlayVariants({ open: animateShow }))}
            onClick={onClose}
            aria-hidden="true"
          />
        )}
        <div
          ref={ref}
          className={cn(drawerContentVariants({ side, open: animateShow }), sizeClass, className)}
          style={resolvedStyle}
          {...props}
        >
          {side === 'bottom' && <Handle />}
          {children}
        </div>
      </>
    );

    if (variant === 'temporary') {
      return typeof document !== 'undefined' ? createPortal(contentEl, document.body) : null;
    }

    return contentEl;
  }
);
Content.displayName = 'DrawerContent';

// ── DrawerHandle (Drag Bar indicator for bottom-sheet) ───────────────────────
export function Handle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { side } = useDrawerContext();

  if (side !== 'bottom') return null;

  return <div className={cn('drawer-handle', className)} {...props} />;
}
Handle.displayName = 'DrawerHandle';

// ── DrawerHeader ─────────────────────────────────────────────────────────────
export function Header({ children, className, ...props }: DrawerHeaderProps) {
  const { onClose, variant } = useDrawerContext();

  return (
    <div className={cn('flex flex-col gap-1.5 p-6 shrink-0 relative', className)} {...props}>
      {children}
      {variant === 'temporary' && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
Header.displayName = 'DrawerHeader';

// ── DrawerTitle ──────────────────────────────────────────────────────────────
export function Title({ children, className, ...props }: DrawerTitleProps) {
  return (
    <h2
      className={cn(
        'text-base font-semibold leading-none tracking-tight text-[var(--color-foreground)]',
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}
Title.displayName = 'DrawerTitle';

// ── DrawerDescription ────────────────────────────────────────────────────────
export function Description({ children, className, ...props }: DrawerDescriptionProps) {
  return (
    <p className={cn('text-sm text-[var(--color-muted-foreground)]', className)} {...props}>
      {children}
    </p>
  );
}
Description.displayName = 'DrawerDescription';

// ── DrawerBody ───────────────────────────────────────────────────────────────
export function Body({ children, className, ...props }: DrawerBodyProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-6 py-2 min-h-0', className)} {...props}>
      {children}
    </div>
  );
}
Body.displayName = 'DrawerBody';

// ── DrawerFooter ─────────────────────────────────────────────────────────────
export function Footer({ children, className, ...props }: DrawerFooterProps) {
  return (
    <div
      className={cn(
        'p-6 border-t border-[var(--color-border)]/50 shrink-0 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-900/10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
Footer.displayName = 'DrawerFooter';

// ── DrawerClose ──────────────────────────────────────────────────────────────
export const Close = React.forwardRef<HTMLButtonElement, DrawerCloseProps>(
  ({ children, asChild, onClick, ...props }, ref) => {
    const { onClose } = useDrawerContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      onClose();
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as any, {
        ref,
        onClick: (e: any) => {
          (children.props as any).onClick?.(e);
          onClose();
        },
      });
    }

    return (
      <Button ref={ref} variant="outline" onClick={handleClick} {...props}>
        {children}
      </Button>
    );
  }
);
Close.displayName = 'DrawerClose';

// Export compound subcomponents attached to main object
export const DrawerComponent = Drawer as typeof Drawer & {
  Trigger: typeof Trigger;
  Portal: typeof Portal;
  Overlay: typeof Overlay;
  Content: typeof Content;
  Handle: typeof Handle;
  Header: typeof Header;
  Title: typeof Title;
  Description: typeof Description;
  Body: typeof Body;
  Footer: typeof Footer;
  Close: typeof Close;
};

(DrawerComponent as any).Trigger = Trigger;
(DrawerComponent as any).Portal = Portal;
(DrawerComponent as any).Overlay = Overlay;
(DrawerComponent as any).Content = Content;
(DrawerComponent as any).Handle = Handle;
(DrawerComponent as any).Header = Header;
(DrawerComponent as any).Title = Title;
(DrawerComponent as any).Description = Description;
(DrawerComponent as any).Body = Body;
(DrawerComponent as any).Footer = Footer;
(DrawerComponent as any).Close = Close;

export default DrawerComponent;
