'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/design-system/utils/utils';
import { badgeVariants } from './badge.variants';
import type { BadgeProps } from './badge.types';
import './badge.css';

// Re-export types for backward compatibility
export * from './badge.types';

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'soft',
      color = 'default',
      size = 'sm',
      className,
      children,
      content,
      max = 99,
      showZero = false,
      dot = false,
      placement = 'top-right',
      pulse = false,
      removable = false,
      onRemove,
      ...props
    },
    ref
  ) => {
    // Sizes configuration
    const sizes = {
      xs: {
        dot: 'w-2.5 h-2.5',
        removeBtn: 'w-2.5 h-2.5 ml-0.5',
      },
      sm: {
        dot: 'w-2.5 h-2.5',
        removeBtn: 'w-3 h-3 ml-1',
      },
      md: {
        dot: 'w-3 h-3',
        removeBtn: 'w-3.5 h-3.5 ml-1',
      },
      lg: {
        dot: 'w-3.5 h-3.5',
        removeBtn: 'w-4 h-4 ml-1.5',
      },
    };

    // Placements
    const placements = {
      'top-right': 'absolute top-0 right-0 translate-x-1/2 -translate-y-1/2',
      'top-left': 'absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2',
      'bottom-right': 'absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2',
      'bottom-left': 'absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
    };

    // Formatted content for notifications
    const formattedContent = React.useMemo(() => {
      if (dot) return null;
      if (typeof content === 'number') {
        if (content === 0 && !showZero) return null;
        if (content > max) return `${max}+`;
      }
      return content;
    }, [content, max, showZero, dot]);

    const pulseColors = {
      default: 'bg-[var(--color-foreground)]',
      primary: 'bg-[var(--color-primary)]',
      secondary: 'bg-[var(--color-secondary)]',
      success: 'bg-[var(--color-success)]',
      warning: 'bg-[var(--color-warning)]',
      danger: 'bg-[var(--color-danger)]',
      info: 'bg-[var(--color-info)]',
      neutral: 'bg-[var(--color-foreground)]',
    };

    const shouldRenderBadge = dot || (content !== undefined && content !== null);

    const renderBadgeBubble = () => {
      if (!shouldRenderBadge) return null;

      const sizeClasses = dot ? sizes[size].dot : '';
      const placementClasses = children ? placements[placement] : '';

      return (
        <span
          ref={ref}
          className={cn(
            badgeVariants({
              variant: variant as any,
              color,
              size: dot ? 'dot' : size,
            }),
            sizeClasses,
            placementClasses,
            className
          )}
          {...props}
        >
          {pulse && (
            <span
              className={cn(
                'absolute -inset-0.5 rounded-full animate-ping opacity-65 pointer-events-none',
                pulseColors[color as keyof typeof pulseColors] || 'bg-current'
              )}
            />
          )}
          <span className="relative z-10 flex items-center justify-center">{formattedContent}</span>
        </span>
      );
    };

    const renderStatusBadge = () => {
      return (
        <span
          ref={ref}
          className={cn(
            badgeVariants({ variant: variant as any, color, size }),
            'inline-flex items-center gap-1.5 whitespace-nowrap',
            className
          )}
          {...props}
        >
          <span className="truncate inline-flex items-center gap-1.5 whitespace-nowrap">{children}</span>
          {removable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              className={cn(
                'rounded-full p-0.5 flex items-center justify-center active:scale-95 transition-all outline-none hover:bg-black/10 dark:hover:bg-white/10 shrink-0',
                sizes[size].removeBtn
              )}
            >
              <X className="w-full h-full" />
            </button>
          )}
        </span>
      );
    };

    if (children && (dot || (content !== undefined && content !== null))) {
      return (
        <div className="relative inline-flex shrink-0">
          {children}
          {renderBadgeBubble()}
        </div>
      );
    }

    return children ? renderStatusBadge() : renderBadgeBubble();
  }
);

Badge.displayName = 'Badge';

export { Badge };
export default Badge;
