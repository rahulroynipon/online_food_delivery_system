'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cn } from '@/design-system/utils/utils';
import { buttonVariants } from './button.variants';
import type { ButtonProps } from './button.types';
import './button.css';

interface RippleDot {
  id: number;
  cx: number;
  cy: number;
  diameter: number;
}

const Button = React.forwardRef<any, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      rounded,
      fullWidth,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      href,
      children,
      disabled,
      type = 'button',
      onMouseDown,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = React.useState<RippleDot[]>([]);
    const lastTouchTime = React.useRef(0);

    const isInteractionsDisabled = disabled || loading;

    const spawnRipple = (clientX: number, clientY: number, currentTarget: HTMLElement) => {
      if (isInteractionsDisabled || variant === 'link') return;

      const rect = currentTarget.getBoundingClientRect();
      let x = clientX - rect.left;
      let y = clientY - rect.top;

      // Fallback for keyboard interactions
      if (clientX === 0 && clientY === 0) {
        x = rect.width / 2;
        y = rect.height / 2;
      }

      const maxDist = Math.sqrt(
        Math.max(x, rect.width - x) ** 2 + Math.max(y, rect.height - y) ** 2
      );
      const diameter = maxDist * 2;

      setRipples((prev) => [...prev, { id: Date.now() + Math.random(), cx: x, cy: y, diameter }]);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      if (Date.now() - lastTouchTime.current < 800) return;
      if (e.button !== 0) return;
      spawnRipple(e.clientX, e.clientY, e.currentTarget);
      if (onMouseDown) {
        onMouseDown(e as any);
      }
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      lastTouchTime.current = Date.now();
      if (e.touches && e.touches[0]) {
        spawnRipple(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
      }
    };

    const removeRipple = (id: number) => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    };

    const renderContent = () => (
      <>
        {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0 relative z-10" />}
        {!loading && leftIcon && (
          <span className="inline-flex shrink-0 relative z-10">{leftIcon}</span>
        )}
        <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
        {!loading && rightIcon && (
          <span className="inline-flex shrink-0 relative z-10">{rightIcon}</span>
        )}

        {ripples.map((r) => {
          const rippleStyles: React.CSSProperties = {
            width: `${r.diameter}px`,
            height: `${r.diameter}px`,
            top: 0,
            left: 0,
            ['--btn-ripple-tx' as any]: `translate(${r.cx - r.diameter / 2}px, ${r.cy - r.diameter / 2}px)`,
          };

          return (
            <span
              key={r.id}
              className="btn-ripple"
              style={rippleStyles}
              onAnimationEnd={() => removeRipple(r.id)}
            />
          );
        })}
      </>
    );

    const buttonClasses = cn(
      buttonVariants({ variant, size, rounded, fullWidth, className }),
      'btn-container'
    );

    // Render as slot
    if (asChild) {
      return (
        <Slot className={buttonClasses} ref={ref as any} {...props}>
          {children}
        </Slot>
      );
    }

    // Render as link
    if (href) {
      const isExternal = href.startsWith('http') || href.startsWith('//');
      const linkClasses = cn(
        buttonClasses,
        isInteractionsDisabled && 'pointer-events-none opacity-50'
      );

      return (
        <a
          href={href}
          className={linkClasses}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          ref={ref as any}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          {...(props as any)}
        >
          {renderContent()}
        </a>
      );
    }

    // Render standard button
    return (
      <button
        type={type}
        className={buttonClasses}
        disabled={isInteractionsDisabled}
        ref={ref as any}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        {...props}
      >
        {renderContent()}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, type ButtonProps };
