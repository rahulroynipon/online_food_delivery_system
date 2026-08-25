'use client';

import * as React from 'react';
import { cn } from '@/design-system/utils/utils';
import type {
  ToggleGroupContextType,
  ToggleGroupItemProps,
  ToggleGroupProps,
} from './toggleGroup.types';
import {
  toggleGroupItemVariants,
  variantPillOverride,
  variantSelected,
  variantUnselected,
} from './toggleGroup.variants';
import './toggleGroup.css';

// ── Context ───────────────────────────────────────────────────────────────────

const ToggleGroupContext = React.createContext<ToggleGroupContextType | null>(null);

function useToggleGroupCtx(): ToggleGroupContextType {
  const ctx = React.useContext(ToggleGroupContext);
  if (!ctx) throw new Error('ToggleGroupItem must be used inside a ToggleGroup');
  return ctx;
}

// ── ToggleGroup ───────────────────────────────────────────────────────────────

export const ToggleGroupInner = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  (
    {
      type = 'single',
      value,
      defaultValue,
      onValueChange,
      size = 'md',
      variant = 'outline',
      rounded = 'md',
      disabled = false,
      allowEmpty = true,
      fullWidth = false,
      className,
      children,
      items,
      activeClassName,
      inactiveClassName,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState<string | string[]>(() => {
      if (defaultValue !== undefined) return defaultValue;
      return type === 'multiple' ? [] : '';
    });

    const isControlled = value !== undefined;
    const activeValue = isControlled ? value! : internalValue;

    const handleSelect = React.useCallback(
      (itemValue: string) => {
        if (disabled) return;

        let next: string | string[];

        if (type === 'multiple') {
          const arr = Array.isArray(activeValue) ? activeValue : [];
          if (arr.includes(itemValue)) {
            if (!allowEmpty && arr.length === 1) {
              next = arr; // prevent deselecting the last item
            } else {
              next = arr.filter((v) => v !== itemValue);
            }
          } else {
            next = [...arr, itemValue];
          }
        } else {
          next = activeValue === itemValue ? (allowEmpty ? '' : activeValue) : itemValue;
        }

        if (!isControlled) setInternalValue(next);
        onValueChange?.(next);
      },
      [type, activeValue, isControlled, onValueChange, disabled, allowEmpty]
    );

    const ctxValue = React.useMemo<ToggleGroupContextType>(
      () => ({
        type,
        value: activeValue,
        onItemSelect: handleSelect,
        size,
        variant,
        rounded,
        disabled,
        activeClassName,
        inactiveClassName,
      }),
      [
        type,
        activeValue,
        handleSelect,
        size,
        variant,
        rounded,
        disabled,
        activeClassName,
        inactiveClassName,
      ]
    );

    if (items) {
      return (
        <ToggleGroupContext.Provider value={ctxValue}>
          <div
            ref={ref}
            role="group"
            className={cn(
              'inline-flex items-center gap-3 flex-wrap',
              fullWidth && 'w-full',
              className
            )}
            {...props}
          >
            {items.map(({ value: itemVal, label, icon, disabled: itemDisabled, ...itemProps }) => (
              <ToggleGroupItem
                key={itemVal}
                value={itemVal}
                disabled={itemDisabled}
                icon={icon}
                {...itemProps}
              >
                {label}
              </ToggleGroupItem>
            ))}
          </div>
        </ToggleGroupContext.Provider>
      );
    }

    return (
      <ToggleGroupContext.Provider value={ctxValue}>
        <div
          ref={ref}
          role="group"
          className={cn(
            'inline-flex items-center gap-3 flex-wrap',
            fullWidth && 'w-full',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  }
);

ToggleGroupInner.displayName = 'ToggleGroup';

// ── ToggleGroupItem ───────────────────────────────────────────────────────────

interface RippleDot {
  id: number;
  cx: number;
  cy: number;
  diameter: number;
}

export const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  (
    {
      value: itemValue,
      children,
      disabled = false,
      icon,
      className,
      activeClassName,
      inactiveClassName,
      ...props
    },
    ref
  ) => {
    const {
      type,
      value,
      onItemSelect,
      size,
      variant,
      rounded,
      disabled: groupDisabled,
      activeClassName: ctxActiveClassName,
      inactiveClassName: ctxInactiveClassName,
    } = useToggleGroupCtx();

    const [ripples, setRipples] = React.useState<RippleDot[]>([]);
    const lastTouchRef = React.useRef(0);

    const isDisabled = groupDisabled || disabled;
    const isSelected =
      type === 'multiple' ? Array.isArray(value) && value.includes(itemValue) : value === itemValue;

    // ── Ripple ──────────────────────────────────────────────────────────────

    const spawnRipple = (clientX: number, clientY: number, target: HTMLElement) => {
      if (isDisabled) return;
      const rect = target.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const maxDist = Math.sqrt(
        Math.max(x, rect.width - x) ** 2 + Math.max(y, rect.height - y) ** 2
      );
      const diameter = maxDist * 2;
      setRipples((prev) => [...prev, { id: Date.now() + Math.random(), cx: x, cy: y, diameter }]);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (Date.now() - lastTouchRef.current < 800) return;
      if (e.button !== 0) return;
      spawnRipple(e.clientX, e.clientY, e.currentTarget);
      props.onMouseDown?.(e);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
      lastTouchRef.current = Date.now();
      if (e.touches?.[0]) spawnRipple(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
    };

    const removeRipple = (id: number) => setRipples((prev) => prev.filter((r) => r.id !== id));

    // ── Render ───────────────────────────────────────────────────────────────

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={isSelected}
        aria-pressed={isSelected}
        disabled={isDisabled}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={() => onItemSelect(itemValue)}
        className={cn(
          toggleGroupItemVariants({ size, rounded }),
          isSelected ? variantSelected[variant] : variantUnselected[variant],
          variantPillOverride[variant],
          'active:scale-[0.97]',
          isSelected
            ? cn(ctxActiveClassName, activeClassName)
            : cn(ctxInactiveClassName, inactiveClassName),
          className
        )}
        {...props}
      >
        {/* Icon */}
        {icon && <span className="relative z-10 shrink-0">{icon}</span>}

        {/* Label */}
        <span className="relative z-10">{children}</span>

        {/* Ripples */}
        {ripples.map((r) => (
          <span
            key={r.id}
            className="tg-ripple"
            style={{
              width: r.diameter,
              height: r.diameter,
              top: 0,
              left: 0,
              ['--tg-ripple-tx' as any]: `translate(${r.cx - r.diameter / 2}px, ${r.cy - r.diameter / 2}px)`,
            }}
            onAnimationEnd={() => removeRipple(r.id)}
          />
        ))}
      </button>
    );
  }
);

ToggleGroupItem.displayName = 'ToggleGroupItem';

(ToggleGroupInner as any).displayName = 'ToggleGroup';

export const ToggleGroup = ToggleGroupInner as typeof ToggleGroupInner & {
  Item: typeof ToggleGroupItem;
};

(ToggleGroup as any).Item = ToggleGroupItem;

// ── Re-export types ───────────────────────────────────────────────────────────

export * from './toggleGroup.types';
