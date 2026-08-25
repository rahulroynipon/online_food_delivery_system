'use client';

import * as React from 'react';
import { AlertCircle, AlertTriangle, CircleCheckBig, Info, Loader2, X } from 'lucide-react';
import { cn } from '@/design-system/utils/utils';
import { alertVariants } from './alert.variants';
import { Button } from '../Button';
import type { AlertProps } from './alert.types';
import './alert.css';

interface AlertContextProps {
  severity: 'info' | 'success' | 'warning' | 'error';
  variant: 'soft' | 'filled' | 'outline';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  handleClose: () => void;
}

const AlertContext = React.createContext<AlertContextProps | null>(null);

const useAlertContext = () => {
  const context = React.useContext(AlertContext);
  if (!context) {
    throw new Error('Alert subcomponents must be used within an <Alert> wrapper');
  }
  return context;
};

const ICONS_MAP = {
  info: Info,
  success: CircleCheckBig,
  warning: AlertTriangle,
  error: AlertCircle,
};

const ICON_SIZES = {
  sm: 14,
  md: 16,
  lg: 20,
};

function hasAlertSubComponent(children: React.ReactNode): boolean {
  let found = false;
  React.Children.forEach(children, (child) => {
    if (found) return;
    if (React.isValidElement(child)) {
      const type = child.type as any;
      if (
        type === AlertIcon ||
        type === AlertTitle ||
        type === AlertDescription ||
        type === AlertAction ||
        type === AlertClose ||
        (type &&
          (type.displayName === 'AlertIcon' ||
            type.displayName === 'AlertTitle' ||
            type.displayName === 'AlertDescription' ||
            type.displayName === 'AlertAction' ||
            type.displayName === 'AlertClose'))
      ) {
        found = true;
      } else {
        const props = child.props as any;
        if (props && props.children) {
          if (hasAlertSubComponent(props.children)) {
            found = true;
          }
        }
      }
    }
  });
  return found;
}

export function Alert({
  title,
  children,
  variant = 'soft',
  severity = 'info',
  size = 'md',
  rounded = 'md',
  icon,
  closable,
  action,
  loading,
  disabled,
  animated = true,
  autoClose,
  duration = 5000,
  pauseOnHover,
  showProgress,
  className,
  style,
  onClose,
  keepMountedOnClose,
  ...props
}: AlertProps) {
  const [visible, setVisible] = React.useState(true);
  const [exiting, setExiting] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(duration);
  const [isHovered, setIsHovered] = React.useState(false);

  // Legacy mapping support for backward compatibility
  const legacyVariants = ['info', 'success', 'warning', 'error', 'danger'];
  const isLegacy = typeof variant === 'string' && legacyVariants.includes(variant);

  let activeVariant: 'soft' | 'filled' | 'outline' = 'soft';
  let activeSeverity = severity;

  if (variant && !isLegacy) {
    activeVariant = variant as 'soft' | 'filled' | 'outline';
  } else if (variant && isLegacy) {
    activeVariant = 'soft';
    activeSeverity = variant === 'danger' ? 'error' : (variant as any);
  }

  React.useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  const handleClose = React.useCallback(() => {
    if (keepMountedOnClose) {
      onClose?.();
      return;
    }
    if (animated) {
      setExiting(true);
    } else {
      setVisible(false);
      onClose?.();
    }
  }, [animated, onClose, keepMountedOnClose]);

  React.useEffect(() => {
    if (!autoClose || !visible || exiting) return;

    let timerId: any;
    const tickRate = 50;

    if (!pauseOnHover || !isHovered) {
      timerId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= tickRate) {
            clearInterval(timerId);
            handleClose();
            return 0;
          }
          return prev - tickRate;
        });
      }, tickRate);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [autoClose, visible, exiting, isHovered, pauseOnHover, handleClose]);

  const handleAnimationEnd = React.useCallback(
    (e: React.AnimationEvent) => {
      if (e.animationName === 'alert-fade-out' || exiting) {
        setVisible(false);
        onClose?.();
      }
    },
    [exiting, onClose]
  );

  if (!visible) return null;

  const contextValue: AlertContextProps = {
    severity: activeSeverity,
    variant: activeVariant,
    size,
    loading,
    disabled,
    icon,
    handleClose,
  };

  const hasSubComponents = hasAlertSubComponent(children);

  return (
    <AlertContext.Provider value={contextValue}>
      <div
        className={cn(
          alertVariants({
            variant: activeVariant,
            severity: activeSeverity,
            size,
            rounded,
          }),
          animated && !exiting && 'alert-animate-in',
          animated && exiting && 'alert-animate-out',
          disabled && 'opacity-60 pointer-events-none cursor-not-allowed',
          className
        )}
        style={style}
        onAnimationEnd={handleAnimationEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="alert"
        {...props}
      >
        {hasSubComponents ? (
          children
        ) : (
          <>
            <AlertIcon />
            <div className="flex-1 min-w-0 space-y-1">
              {title && <AlertTitle>{title}</AlertTitle>}
              {children && <AlertDescription>{children}</AlertDescription>}
            </div>
            {action && <AlertAction>{action}</AlertAction>}
            {closable && <AlertClose onClick={handleClose} />}
          </>
        )}
        {showProgress && autoClose && (
          <div
            className="absolute bottom-0 left-0 h-[3px] bg-current opacity-40 transition-all duration-75"
            style={{
              width: `${(timeLeft / duration) * 100}%`,
            }}
          />
        )}
      </div>
    </AlertContext.Provider>
  );
}

export function AlertIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const { severity, loading, icon, size } = useAlertContext();
  const currentSize = ICON_SIZES[size];

  if (icon) {
    return (
      <span className={cn('shrink-0', className)} style={style}>
        {icon}
      </span>
    );
  }

  if (loading) {
    return (
      <Loader2
        size={currentSize}
        className={cn('animate-spin shrink-0 text-current', className)}
        style={style}
      />
    );
  }

  const IconComponent = ICONS_MAP[severity] || Info;
  return (
    <IconComponent
      size={currentSize}
      className={cn('shrink-0 mt-0.5 text-current', className)}
      style={style}
    />
  );
}

export function AlertTitle({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { size } = useAlertContext();

  const fontSizes = {
    sm: 'text-xs font-semibold leading-none',
    md: 'text-sm font-semibold leading-snug',
    lg: 'text-base font-bold leading-normal',
  };

  return (
    <h5
      className={cn(fontSizes[size], className)}
      style={{ margin: 0, letterSpacing: '-0.01em', ...style }}
    >
      {children}
    </h5>
  );
}

export function AlertDescription({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { size } = useAlertContext();

  const descSizes = {
    sm: 'text-[11px] leading-normal opacity-90',
    md: 'text-xs leading-relaxed opacity-90',
    lg: 'text-sm leading-relaxed opacity-90',
  };

  return (
    <div className={cn(descSizes[size], className)} style={style}>
      {children}
    </div>
  );
}

export function AlertAction({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn('shrink-0 flex items-center gap-1.5 ml-auto pl-2', className)} style={style}>
      {children}
    </div>
  );
}

export function AlertClose({
  onClick,
  className,
  style,
}: {
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { size, disabled, handleClose } = useAlertContext();

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const buttonSize = size === 'sm' ? ('icon-xs' as const) : ('icon-sm' as const);

  return (
    <Button
      variant="ghost"
      size={buttonSize}
      rounded="full"
      onClick={(e) => {
        onClick?.(e);
        handleClose();
      }}
      disabled={disabled}
      className={cn(
        'shrink-0 text-current hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center p-0',
        className
      )}
      style={style}
      aria-label="Dismiss Alert"
    >
      <X size={iconSizes[size]} />
    </Button>
  );
}

Alert.displayName = 'Alert';
AlertIcon.displayName = 'AlertIcon';
AlertTitle.displayName = 'AlertTitle';
AlertDescription.displayName = 'AlertDescription';
AlertAction.displayName = 'AlertAction';
AlertClose.displayName = 'AlertClose';
