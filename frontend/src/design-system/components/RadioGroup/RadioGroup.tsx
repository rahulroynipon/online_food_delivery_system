'use client';

import * as React from 'react';
import { cn } from '@/design-system/utils/utils';
import type {
  RadioGroupProps,
  RadioGroupSize,
  RadioItemProps,
  RadioProps,
} from './radioGroup.types';
import { SIZE } from './radioGroup.variants';
import './radioGroup.css';

// Re-export types for backward compatibility
export * from './radioGroup.types';

interface RadioGroupCtx {
  selectedValue: string;
  select: (value: string) => void;
  disabled: boolean;
  size: RadioGroupSize;
  ripple: boolean;
  name: string;
  hasError: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupCtx | null>(null);

const useRadioGroup = () => {
  return React.useContext(RadioGroupContext);
};

interface RippleWave {
  id: number;
  waveIndex: number;
  color: string;
}

// Standalone Radio Component matching Material UI structure
export const Radio = React.forwardRef<HTMLButtonElement, RadioProps>(
  ({ value, checked, disabled: itemDisabled, className, ...props }, ref) => {
    const context = useRadioGroup();

    const selectedValue = context ? context.selectedValue : undefined;
    const select = context ? context.select : undefined;
    const groupDisabled = context ? context.disabled : false;
    const size = context ? context.size : 'md';
    const rippleEnabled = context ? context.ripple : true;
    const name = context ? context.name : undefined;
    const hasError = context ? context.hasError : false;

    const isDisabled = groupDisabled || itemDisabled;
    const isSelected = selectedValue === value || checked;
    const s = SIZE[size];

    const [isHovered, setIsHovered] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const [waves, setWaves] = React.useState<RippleWave[]>([]);

    const triggerRipple = () => {
      if (isDisabled || !rippleEnabled) return;
      const baseId = Date.now();
      const waveColors = getRippleWaveColors();
      setWaves((prev) => [
        ...prev,
        ...[0, 1, 2].map((waveIndex) => ({
          id: baseId + waveIndex,
          waveIndex,
          color: waveColors[waveIndex],
        })),
      ]);
    };

    const getRippleWaveColors = (): [string, string, string] => {
      if (hasError) {
        return [
          'color-mix(in srgb, var(--color-danger) 20%, transparent)',
          'color-mix(in srgb, var(--color-danger) 10%, transparent)',
          'color-mix(in srgb, var(--color-danger) 4%, transparent)',
        ];
      }
      return [
        'color-mix(in srgb, var(--color-primary) 20%, transparent)',
        'color-mix(in srgb, var(--color-primary) 10%, transparent)',
        'color-mix(in srgb, var(--color-primary) 4%, transparent)',
      ];
    };

    const removeWave = (id: number) => setWaves((prev) => prev.filter((w) => w.id !== id));

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) return;
      triggerRipple();
      select?.(value);
      props.onClick?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === ' ' || e.key === 'Enter') && !isDisabled) {
        e.preventDefault();
        triggerRipple();
        select?.(value);
      }
      props.onKeyDown?.(e);
    };

    const waveDelays = [0, 100, 200];

    return (
      <button
        ref={ref}
        role="radio"
        aria-checked={isSelected}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : 0}
        type="button"
        disabled={isDisabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => !isDisabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => !isDisabled && setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          'relative flex items-center justify-center rounded-full shrink-0 overflow-hidden outline-none transition-colors duration-150',
          isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
          className
        )}
        style={{
          width: s.rippleZone,
          height: s.rippleZone,
          color: hasError
            ? 'var(--color-danger)'
            : isSelected
              ? 'var(--color-primary)'
              : 'color-mix(in srgb, var(--color-foreground) 54%, transparent)',
          backgroundColor: !isDisabled
            ? isFocused
              ? hasError
                ? 'color-mix(in srgb, var(--color-danger) 10%, transparent)'
                : 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
              : isHovered
                ? hasError
                  ? 'color-mix(in srgb, var(--color-danger) 8%, transparent)'
                  : 'color-mix(in srgb, var(--color-primary) 8%, transparent)'
                : 'transparent'
            : 'transparent',
        }}
      >
        <input
          type="radio"
          name={name}
          value={value}
          checked={isSelected}
          disabled={isDisabled}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={() => {}}
        />

        {waves.map((wave) => (
          <span
            key={wave.id}
            className="absolute inset-0 rounded-full pointer-events-none cb-wave-effect"
            style={{
              backgroundColor: wave.color,
              animationDelay: `${waveDelays[wave.waveIndex]}ms`,
            }}
            onAnimationEnd={() => removeWave(wave.id)}
          />
        ))}

        <span
          className={cn(
            'relative flex items-center justify-center rounded-full shrink-0 transition-all duration-150 border-2 pointer-events-none'
          )}
          style={{
            width: s.ring,
            height: s.ring,
            borderColor: isSelected
              ? hasError
                ? 'var(--color-danger)'
                : 'var(--color-primary)'
              : hasError
                ? 'var(--color-danger)'
                : 'color-mix(in srgb, var(--color-foreground) 62%, transparent)',
          }}
        >
          {isSelected && (
            <span
              className="rounded-full bg-current rg-dot-pop"
              style={{
                width: s.dot,
                height: s.dot,
                color: hasError ? 'var(--color-danger)' : 'var(--color-primary)',
              }}
            />
          )}
        </span>
      </button>
    );
  }
);
Radio.displayName = 'Radio';

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      label,
      description,
      error,
      disabled = false,
      required = false,
      orientation = 'vertical',
      size = 'md',
      fullWidth = false,
      ripple = true,
      className,
      children,
      name,
    },
    ref
  ) => {
    const [internal, setInternal] = React.useState(defaultValue ?? '');
    const isControlled = value !== undefined;
    const selectedValue = isControlled ? value : internal;

    const select = (v: string) => {
      if (!isControlled) setInternal(v);
      onValueChange?.(v);
    };

    const groupId = React.useId();
    const groupName = name ?? groupId;
    const hasError = Boolean(error);
    const s = SIZE[size];

    const ctx: RadioGroupCtx = {
      selectedValue,
      select,
      disabled,
      size,
      ripple,
      name: groupName,
      hasError,
    };

    const isHoriz = orientation === 'horizontal';
    const itemsClass = cn('flex', s.gap, isHoriz ? 'flex-row flex-wrap' : 'flex-col');

    return (
      <RadioGroupContext.Provider value={ctx}>
        <div
          ref={ref}
          role="radiogroup"
          aria-labelledby={label ? `${groupId}-lbl` : undefined}
          aria-describedby={error ? `${groupId}-err` : description ? `${groupId}-desc` : undefined}
          aria-required={required}
          className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', className)}
        >
          {label && (
            <div className="flex flex-col gap-0.5 select-none">
              <span
                id={`${groupId}-lbl`}
                className={cn(
                  'leading-none tracking-tight font-normal',
                  hasError ? 'text-[var(--color-danger)]' : 'text-[var(--color-muted-foreground)]'
                )}
                style={{ fontSize: '13px' }}
              >
                {label}
                {required && (
                  <span className="ml-0.5 text-[0.65em] text-[var(--color-danger)]">*</span>
                )}
              </span>
              {description && (
                <span
                  id={`${groupId}-desc`}
                  className={cn('leading-snug mt-0.5 text-[var(--color-muted-foreground)]', s.desc)}
                >
                  {description}
                </span>
              )}
            </div>
          )}

          <div className={itemsClass}>{children}</div>

          {error && (
            <p
              id={`${groupId}-err`}
              className={cn('font-medium text-[var(--color-danger)]', s.desc)}
            >
              {error}
            </p>
          )}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = 'RadioGroup';

export const RadioItem = React.forwardRef<HTMLButtonElement, RadioItemProps>(
  ({ value, label, description, disabled: itemDisabled = false, className }, ref) => {
    const context = useRadioGroup();
    const groupDisabled = context ? context.disabled : false;
    const size = context ? context.size : 'md';
    const hasError = context ? context.hasError : false;
    const selectedValue = context ? context.selectedValue : undefined;

    const isDisabled = groupDisabled || itemDisabled;
    const isSelected = selectedValue === value;
    const s = SIZE[size];

    const paddingTopValue = (s.rippleZone - s.ring) / 2;

    return (
      <label
        className={cn(
          'flex items-start select-none cursor-pointer group',
          isDisabled && 'opacity-45 cursor-not-allowed',
          className
        )}
      >
        <Radio value={value} disabled={isDisabled} ref={ref} />
        {(label || description) && (
          <div
            className="flex flex-col justify-center min-w-0 ml-2.5"
            style={{ paddingTop: paddingTopValue }}
          >
            {label && (
              <span
                className={cn(
                  'leading-none transition-colors duration-150',
                  s.label,
                  hasError ? 'text-[var(--color-danger)]' : 'text-[var(--color-foreground)]'
                )}
              >
                {label}
              </span>
            )}
            {description && (
              <span
                className={cn('mt-1 leading-snug text-[var(--color-muted-foreground)]', s.desc)}
              >
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);
RadioItem.displayName = 'RadioItem';

export { RadioGroup as RadioGroupRoot };
export default RadioGroup;
