'use client';

import * as React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';
import { cn } from '@/design-system/utils/utils';
import type {
  ModalCloseProps,
  ModalContentProps,
  ModalFooterProps,
  ModalHeaderProps,
  ModalPanelProps,
  ModalProps,
  ModalTriggerProps,
} from './modal.types';
import { modalPanelVariants } from './modal.variants';
import './modal.css';

import { Button } from '../Button';

// Re-export types for backward compatibility
export * from './modal.types';

interface ModalContextValue {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'default';
  accentColor?: string;
  setAccentColor?: (color: string) => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal subcomponents must be used inside a <Modal /> wrapper.');
  }
  return context;
};

// ── Header ───────────────────────────────────────────────────────────────────

export const Header = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  (
    {
      children,
      className,
      style,
      showClose = true,
      showInfo = false,
      onInfoClick,
      action,
      accentColor,
      showSeparator = true,
      icon,
      title,
      description,
      ...props
    },
    ref
  ) => {
    const { onClose, variant, setAccentColor, rounded } = useModalContext();
    const finalVariant = variant || 'default';

    // Accent color: use prop or fallback to variant color
    const finalAccentColor = accentColor || (finalVariant !== 'default' ? finalVariant : undefined);

    const finalIcon = icon;

    useEffect(() => {
      if (finalAccentColor && setAccentColor) {
        setAccentColor(finalAccentColor);
      }
    }, [finalAccentColor, setAccentColor]);

    const roundedTopMap: Record<string, string> = {
      none: 'rounded-t-none',
      sm: 'rounded-t-[var(--radius-sm)]',
      md: 'rounded-t-[var(--radius-md)]',
      lg: 'rounded-t-[var(--radius-lg)]',
      full: 'rounded-t-[var(--radius-full)]',
    };
    const roundedTopClass = roundedTopMap[rounded || 'lg'] || 'rounded-t-[var(--radius-lg)]';

    const accentColorMap: Record<string, string> = {
      primary: 'var(--color-primary)',
      secondary: 'var(--color-secondary)',
      success: 'var(--color-success)',
      warning: 'var(--color-warning)',
      danger: 'var(--color-danger)',
      info: 'var(--color-info)',
    };
    const accentColorVal = finalAccentColor
      ? accentColorMap[finalAccentColor] || finalAccentColor
      : undefined;

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex items-start justify-between px-6 pb-4 shrink-0',
          roundedTopClass,
          finalAccentColor ? 'pt-6' : 'pt-4',
          showSeparator && 'border-b border-[var(--color-border)]/50',
          className
        )}
        style={style}
        {...props}
      >
        <div className={cn('flex-1 min-w-0', showClose || showInfo || action ? 'pr-4' : 'pr-0')}>
          {title || description || finalIcon ? (
            <div className="flex items-start gap-3 text-left">
              {finalIcon && <div className="shrink-0 mt-0.5">{finalIcon}</div>}
              <div className="min-w-0 flex-1">
                {title && (
                  <h3 className="text-lg font-bold text-[var(--color-foreground)] leading-6 truncate">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-1 leading-normal">
                    {description}
                  </p>
                )}
                {children}
              </div>
            </div>
          ) : typeof children === 'string' ? (
            <h3 className="text-lg font-bold text-[var(--color-foreground)] truncate text-left">
              {children}
            </h3>
          ) : (
            children
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 -mr-2 -mt-1.5">
          {action}
          {showInfo && (
            <Button
              onClick={onInfoClick}
              variant="ghost"
              size="icon-xs"
              rounded="full"
              style={
                accentColorVal
                  ? ({ '--hover-color': accentColorVal } as React.CSSProperties)
                  : undefined
              }
              className="text-[var(--color-muted-foreground)] hover:text-[var(--hover-color,var(--color-foreground))]"
            >
              <Info size={18} />
            </Button>
          )}
          {showClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon-xs"
              rounded="full"
              style={
                accentColorVal
                  ? ({ '--hover-color': accentColorVal } as React.CSSProperties)
                  : undefined
              }
              className="text-[var(--color-muted-foreground)] hover:text-[var(--hover-color,var(--color-foreground))]"
            >
              <X size={18} />
            </Button>
          )}
        </div>
      </div>
    );
  }
);
Header.displayName = 'ModalHeader';

// ── Content ──────────────────────────────────────────────────────────────────

export const Content = React.forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('overflow-y-auto px-3 py-2 md:px-6 md:py-5 flex-1 min-h-0', className)}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Content.displayName = 'ModalContent';

// ── Footer ───────────────────────────────────────────────────────────────────

export const Footer = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ children, className, style, showSeparator = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-end gap-3 px-3 py-2 md:px-6 md:py-4 bg-[var(--color-muted)]/10 shrink-0',
          showSeparator && 'border-t border-(--color-border)/50',
          className
        )}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Footer.displayName = 'ModalFooter';

// ── Trigger ──────────────────────────────────────────────────────────────────

export const Trigger = React.forwardRef<HTMLButtonElement, ModalTriggerProps>(
  ({ children, asChild, ...props }, ref) => {
    const { onOpen } = useModalContext();

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        onClick: (e: React.MouseEvent) => {
          const { onClick: originalOnClick } = (children as any).props;
          originalOnClick?.(e);
          onOpen();
        },
      });
    }

    return (
      <button ref={ref} onClick={onOpen} {...props}>
        {children}
      </button>
    );
  }
);
Trigger.displayName = 'ModalTrigger';

// ── Close ────────────────────────────────────────────────────────────────────

export const Close = React.forwardRef<HTMLButtonElement, ModalCloseProps>(
  ({ children, asChild, ...props }, ref) => {
    const { onClose } = useModalContext();

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        onClick: (e: React.MouseEvent) => {
          const { onClick: originalOnClick } = (children as any).props;
          originalOnClick?.(e);
          onClose();
        },
      });
    }

    return (
      <button ref={ref} onClick={onClose} {...props}>
        {children}
      </button>
    );
  }
);
Close.displayName = 'ModalClose';

export const Panel = React.forwardRef<HTMLDivElement, ModalPanelProps>(
  (
    {
      children,
      className,
      size: propSize,
      rounded: propRounded,
      accentColor: propAccentColor,
      style,
      ...props
    },
    ref
  ) => {
    const {
      open,
      onClose,
      size: contextSize,
      rounded: contextRounded,
      variant,
      accentColor: contextAccentColor,
    } = useModalContext();
    const size = propSize || contextSize || 'md';
    const rounded = propRounded || contextRounded || 'lg';
    const accentColor = propAccentColor || contextAccentColor;
    const [mounted, setMounted] = useState(false);
    const [shouldRender, setShouldRender] = useState(open);
    const [animateShow, setAnimateShow] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (open) {
        setShouldRender(true);
        // Delay slightly to ensure the DOM has mounted and painted the initial closed styles
        const timer = setTimeout(() => {
          setAnimateShow(true);
        }, 20);
        return () => clearTimeout(timer);
      } else {
        setAnimateShow(false);
        const timer = setTimeout(() => {
          setShouldRender(false);
        }, 250);
        return () => clearTimeout(timer);
      }
    }, [open]);

    if (!shouldRender || !mounted) return null;

    const accentColorMap: Record<string, string> = {
      primary: 'var(--color-primary)',
      secondary: 'var(--color-secondary)',
      success: 'var(--color-success)',
      warning: 'var(--color-warning)',
      danger: 'var(--color-danger)',
      info: 'var(--color-info)',
    };

    const finalAccentColor =
      accentColor || (variant && variant !== 'default' ? variant : undefined);
    const accentColorVal = finalAccentColor
      ? accentColorMap[finalAccentColor] || finalAccentColor
      : undefined;

    const roundedTopMap: Record<string, string> = {
      none: 'rounded-t-none',
      sm: 'rounded-t-[var(--radius-sm)]',
      md: 'rounded-t-[var(--radius-md)]',
      lg: 'rounded-t-[var(--radius-lg)]',
      full: 'rounded-t-[var(--radius-full)]',
    };
    const roundedTopClass = roundedTopMap[rounded] || 'rounded-t-[var(--radius-lg)]';

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className={cn('absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-all')}
          style={{
            opacity: animateShow ? 1 : 0,
            transitionDuration: '250ms',
            transitionTimingFunction: 'cubic-bezier(0.55, 0, 0.55, 0.2)',
          }}
          onClick={onClose}
        />
        {/* Panel */}
        <div
          ref={ref}
          className={cn(
            modalPanelVariants({ size, rounded }),
            'overflow-hidden transition-all',
            className
          )}
          style={{
            ...style,
            opacity: animateShow ? 1 : 0,
            transform: animateShow ? 'scale(1)' : 'scale(0.9)',
            transformOrigin: 'center center',
            transitionProperty: 'transform, opacity',
            transitionDuration: '250ms',
            transitionTimingFunction: animateShow
              ? 'cubic-bezier(0.075, 0.82, 0.165, 1)'
              : 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
          }}
          {...props}
        >
          {accentColorVal && (
            <div
              className={cn('absolute inset-x-0 top-0 h-2.5 z-0', roundedTopClass)}
              style={{ backgroundColor: accentColorVal }}
            />
          )}
          {children}
        </div>
      </div>,
      document.body
    );
  }
);
Panel.displayName = 'ModalPanel';

// ── Modal Root ───────────────────────────────────────────────────────────────

export const ModalInner = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open: controlledOpen,
      isOpen,
      onClose: controlledClose,
      title,
      description,
      children,
      size = 'md',
      rounded = 'lg',
      variant = 'default',
      accentColor: propAccentColor,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const [localOpen, setLocalOpen] = useState(false);
    const [accentColor, setAccentColor] = useState<string | undefined>(propAccentColor);
    const isControlled = controlledOpen !== undefined || isOpen !== undefined;
    const open = isControlled ? (controlledOpen !== undefined ? controlledOpen : !!isOpen) : localOpen;

    useEffect(() => {
      if (propAccentColor !== undefined) {
        setAccentColor(propAccentColor);
      }
    }, [propAccentColor]);

    const onOpen = useCallback(() => {
      if (!isControlled) setLocalOpen(true);
    }, [isControlled]);

    const onClose = useCallback(() => {
      if (controlledClose) controlledClose();
      if (!isControlled) setLocalOpen(false);
    }, [isControlled, controlledClose]);

    useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      if (open) document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    const contextValue: ModalContextValue = {
      open,
      onOpen,
      onClose,
      size,
      rounded,
      variant: variant as ModalContextValue['variant'],
      accentColor,
      setAccentColor,
    };

    // Check if the user is using the stateless composition model (explicitly renders a Panel)
    const hasPanelChild = React.Children.toArray(children).some(
      (child) =>
        React.isValidElement(child) &&
        (child.type === Panel || (child.type as any).displayName === 'ModalPanel')
    );

    if (hasPanelChild) {
      return <ModalContext.Provider value={contextValue}>{children}</ModalContext.Provider>;
    }

    // Backward compatibility with flat API
    if (title) {
      return (
        <ModalContext.Provider value={contextValue}>
          <Panel size={size} ref={ref} className={className} style={style} {...props}>
            <Header showClose title={title} description={description} />
            <Content>{children}</Content>
          </Panel>
        </ModalContext.Provider>
      );
    }

    return (
      <ModalContext.Provider value={contextValue}>
        <Panel size={size} ref={ref} className={className} style={style} {...props}>
          {children}
        </Panel>
      </ModalContext.Provider>
    );
  }
);
(ModalInner as any).displayName = 'Modal';

export const Modal = ModalInner as typeof ModalInner & {
  Header: typeof Header;
  Content: typeof Content;
  Footer: typeof Footer;
  Trigger: typeof Trigger;
  Close: typeof Close;
  Panel: typeof Panel;
};

(Modal as any).Header = Header;
(Modal as any).Content = Content;
(Modal as any).Footer = Footer;
(Modal as any).Trigger = Trigger;
(Modal as any).Close = Close;
(Modal as any).Panel = Panel;

export default Modal;
