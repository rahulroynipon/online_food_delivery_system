'use client';

import * as React from 'react';
import { Switch as SwitchPrimitive } from 'radix-ui';
import { cn } from '@/design-system/utils/utils';
import { Loader2 } from 'lucide-react';
import type { SwitchProps } from './switch.types';
import './switch.css';

interface RippleWave {
  id: number;
  size: number;
  color: string;
  delay: number;
}

function useSwitchRipple(enabled: boolean, colorVar: string, isChecked: boolean) {
  const [ripples, setRipples] = React.useState<RippleWave[]>([]);

  const spawn = () => {
    if (!enabled) return;
    const baseId = Date.now();

    const colors: [string, string, string] = isChecked
      ? [
          `color-mix(in srgb, var(${colorVar}) 35%, transparent)`,
          `color-mix(in srgb, var(${colorVar}) 18%, transparent)`,
          `color-mix(in srgb, var(${colorVar}) 8%, transparent)`,
        ]
      : [
          'color-mix(in srgb, var(--color-foreground) 20%, transparent)',
          'color-mix(in srgb, var(--color-foreground) 10%, transparent)',
          'color-mix(in srgb, var(--color-foreground) 4%, transparent)',
        ];

    const newWaves: RippleWave[] = [0, 1, 2].map((i) => ({
      id: baseId + i,
      size: 36,
      color: colors[i],
      delay: i * 90,
    }));
    setRipples((p) => [...p, ...newWaves]);
  };

  const remove = (id: number) => setRipples((p) => p.filter((r) => r.id !== id));

  const nodes = ripples.map((r) => (
    <span
      key={r.id}
      className="absolute rounded-full pointer-events-none sw-ripple-effect"
      style={{
        width: r.size,
        height: r.size,
        top: '50%',
        left: '50%',
        backgroundColor: r.color,
        animationDelay: `${r.delay}ms`,
        zIndex: 0,
      }}
      onAnimationEnd={() => remove(r.id)}
    />
  ));

  return { spawn, nodes };
}

export const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  (
    {
      checked,
      defaultChecked,
      onCheckedChange,
      disabled = false,
      loading = false,
      label,
      description,
      hint,
      error,
      required = false,
      size = 'md',
      color = 'primary',
      className,
      id,
      name,
      ...props
    },
    ref
  ) => {
    const isControlled = checked !== undefined;
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked ?? false);
    const isChecked = isControlled ? checked! : internalChecked;

    const [isHovered, setIsHovered] = React.useState(false);

    const handleChange = (val: boolean) => {
      if (disabled || loading) return;
      if (!isControlled) setInternalChecked(val);
      onCheckedChange?.(val);
    };

    const uniqueId = id ?? `switch-${React.useId()}`;

    const colorVars = {
      primary: '--color-primary',
      success: '--color-success',
      warning: '--color-warning',
      danger: '--color-danger',
    };

    const activeColorVar = colorVars[color];

    const sizes = {
      sm: {
        trackW: 32,
        trackH: 16,
        thumbD: 12,
        offset: 2,
        loaderSize: 10,
        label: 'text-sm',
        desc: 'text-xs',
      },
      md: {
        trackW: 44,
        trackH: 24,
        thumbD: 18,
        offset: 3,
        loaderSize: 12,
        label: 'text-sm',
        desc: 'text-xs',
      },
      lg: {
        trackW: 56,
        trackH: 28,
        thumbD: 22,
        offset: 3,
        loaderSize: 14,
        label: 'text-base',
        desc: 'text-sm',
      },
    };
    const s = sizes[size];
    const thumbTravel = s.trackW - s.thumbD - s.offset * 2;

    const ripple = useSwitchRipple(!disabled && !loading, activeColorVar, isChecked);
    const hasDetails = !!(description || hint || error);

    const indentMap = {
      sm: 44,
      md: 56,
      lg: 68,
    };

    return (
      <div className={cn('flex flex-col gap-0.5', className)}>
        <div className="flex items-center gap-3 group/sw select-none">
          <div
            className={cn(
              'relative shrink-0 select-none transition-opacity duration-200',
              disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            )}
            style={{ width: s.trackW, height: s.trackH }}
            onMouseEnter={() => !disabled && !loading && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <SwitchPrimitive.Root
              id={uniqueId}
              ref={ref}
              name={name}
              checked={isChecked}
              onCheckedChange={handleChange}
              disabled={disabled || loading}
              required={required}
              onClick={() => ripple.spawn()}
              aria-label={typeof label === 'string' ? label : undefined}
              style={{ position: 'absolute', inset: 0, zIndex: 3 }}
              className="opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
              {...props}
            />

            <div
              className={cn(
                'absolute inset-0 rounded-full transition-colors duration-300 ease-in-out pointer-events-none'
              )}
              style={{
                backgroundColor: isChecked ? `var(${activeColorVar})` : 'var(--color-input)',
              }}
            />

            <div
              className="absolute rounded-full flex items-center justify-center pointer-events-none bg-white shadow-md transition-all duration-250"
              style={{
                width: s.thumbD,
                height: s.thumbD,
                top: s.offset,
                left: s.offset,
                transform: isChecked ? `translateX(${thumbTravel}px)` : 'translateX(0)',
                overflow: 'hidden',
                zIndex: 2,
              }}
            >
              {ripple.nodes}

              <span
                className="absolute inset-0 rounded-full transition-colors duration-200"
                style={{
                  backgroundColor:
                    isHovered && !disabled && !loading
                      ? 'color-mix(in srgb, var(--color-foreground) 8%, transparent)'
                      : 'transparent',
                }}
              />

              {loading && (
                <Loader2
                  size={s.loaderSize}
                  className="animate-spin relative z-10"
                  style={{
                    color: isChecked ? `var(${activeColorVar})` : 'var(--color-muted-foreground)',
                  }}
                />
              )}
            </div>
          </div>

          {label && (
            <label
              htmlFor={uniqueId}
              onClick={(e) => {
                e.preventDefault();
                if (!disabled && !loading) {
                  handleChange(!isChecked);
                  ripple.spawn();
                }
              }}
              className={cn(
                'font-medium select-none leading-none cursor-pointer text-[var(--color-foreground)]',
                s.label,
                disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
              )}
              style={{ color: error ? 'var(--color-danger)' : undefined }}
            >
              {label}
              {required && <span className="ml-1 text-[var(--color-danger)]">*</span>}
            </label>
          )}
        </div>

        {hasDetails && (
          <div
            className="pointer-events-none flex flex-col gap-1"
            style={{ paddingLeft: indentMap[size] }}
          >
            {error && <p className="text-xs font-medium text-[var(--color-danger)]">{error}</p>}
            {description && !error && (
              <p
                className={cn(
                  'leading-snug select-none text-[var(--color-muted-foreground)]',
                  s.desc
                )}
              >
                {description}
              </p>
            )}
            {hint && !error && !description && (
              <p className="text-xs text-[var(--color-muted-foreground)]">{hint}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Switch.displayName = 'Switch';
export default Switch;
