'use client';

import * as React from 'react';
import { cn } from '@/design-system/utils/utils';
import { Check, Minus } from 'lucide-react';
import type { CheckboxGroupProps, CheckboxProps } from './checkbox.types';
import './checkbox.css';

interface CheckboxGroupContextType {
  name?: string;
  checkedIds: Set<string>;
  toggleId: (id: string, checked: boolean) => void;
  toggleAll: (checked: boolean) => void;
  allChecked: boolean;
  indeterminate: boolean;
  registerId: (id: string, disabled: boolean) => () => void;
}

const CheckboxGroupContext = React.createContext<CheckboxGroupContextType | null>(null);
export const useCheckboxGroupContext = () => React.useContext(CheckboxGroupContext);

interface RippleWave {
  id: number;
  waveIndex: number;
  color: string;
}

function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T | undefined>(undefined);
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      checked,
      defaultChecked,
      onCheckedChange,
      label,
      description,
      hint,
      error,
      disabled = false,
      required = false,
      indeterminate = false,
      size = 'md',
      name,
      id,
      children,
      value,
      isGroupParent = false,
      ignoreGroup = false,
      ...props
    },
    ref
  ) => {
    const groupContext = ignoreGroup ? null : useCheckboxGroupContext();

    React.useEffect(() => {
      if (groupContext && value && !isGroupParent) {
        return groupContext.registerId(value, disabled);
      }
    }, [groupContext, value, disabled, isGroupParent]);

    const [internalChecked, setInternalChecked] = React.useState(defaultChecked ?? false);
    const [isFocused, setIsFocused] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const [waves, setWaves] = React.useState<RippleWave[]>([]);

    const isControlled = checked !== undefined;

    let isChecked = isControlled ? (checked ?? false) : internalChecked;
    let isIndeterminate = indeterminate;

    if (groupContext) {
      if (isGroupParent) {
        isChecked = groupContext.allChecked;
        isIndeterminate = groupContext.indeterminate;
      } else if (value) {
        isChecked = groupContext.checkedIds.has(value);
      }
    }

    const isActive = isChecked || isIndeterminate;
    const [iconKey, setIconKey] = React.useState(0);
    const prevActive = usePrevious(isActive);

    React.useEffect(() => {
      if (isActive && !prevActive) {
        setIconKey((k) => k + 1);
      }
    }, [isActive, prevActive]);

    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = isIndeterminate;
      }
    }, [isIndeterminate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextVal = e.target.checked;

      if (groupContext) {
        if (isGroupParent) {
          groupContext.toggleAll(nextVal);
        } else if (value) {
          groupContext.toggleId(value, nextVal);
        }
      } else {
        if (!isControlled) {
          setInternalChecked(nextVal);
        }
        onCheckedChange?.(nextVal);
      }
    };

    const getRippleWaveColors = (): [string, string, string] => {
      if (error) {
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

    const triggerRipple = () => {
      if (disabled) return;
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

    const removeWave = (id: number) => setWaves((prev) => prev.filter((w) => w.id !== id));

    const handleToggle = () => {
      if (disabled) return;

      const nextVal = isIndeterminate ? true : !isChecked;

      if (groupContext) {
        if (isGroupParent) {
          groupContext.toggleAll(nextVal);
        } else if (value) {
          groupContext.toggleId(value, nextVal);
        }
      } else {
        if (!isControlled) {
          setInternalChecked(nextVal);
        }
        onCheckedChange?.(nextVal);
      }
    };

    const sizeConfig = {
      sm: {
        rippleZone: 30,
        checkboxBox: 'w-[16px] h-[16px] rounded-[4px]',
        iconSize: 10,
        labelClass: 'text-xs',
        descClass: 'text-[10px]',
        childIndent: 'ml-[15px] pl-3',
      },
      md: {
        rippleZone: 38,
        checkboxBox: 'w-[20px] h-[20px] rounded-[5px]',
        iconSize: 13,
        labelClass: 'text-sm',
        descClass: 'text-xs',
        childIndent: 'ml-[19px] pl-4',
      },
      lg: {
        rippleZone: 46,
        checkboxBox: 'w-[24px] h-[24px] rounded-[6px]',
        iconSize: 16,
        labelClass: 'text-base',
        descClass: 'text-sm',
        childIndent: 'ml-[23px] pl-5',
      },
    };

    const activeSize = sizeConfig[size];
    const waveDelays = [0, 100, 200];

    return (
      <div className={cn('flex flex-col gap-1 w-full', className)}>
        <div className="flex items-start select-none">
          <div
            role="checkbox"
            aria-checked={isIndeterminate ? 'mixed' : isChecked}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            className={cn(
              'relative flex items-center justify-center shrink-0 rounded-full overflow-hidden transition-colors duration-200 outline-none',
              disabled ? 'cursor-not-allowed' : 'cursor-pointer'
            )}
            style={{
              width: activeSize.rippleZone,
              height: activeSize.rippleZone,
              backgroundColor:
                isHovered && !disabled
                  ? error
                    ? 'color-mix(in srgb, var(--color-danger) 8%, transparent)'
                    : 'color-mix(in srgb, var(--color-primary) 8%, transparent)'
                  : 'transparent',
            }}
            onMouseEnter={() => !disabled && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={triggerRipple}
            onClick={handleToggle}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                triggerRipple();
                handleToggle();
              }
            }}
          >
            <input
              ref={inputRef}
              type="checkbox"
              name={name}
              checked={isChecked}
              onChange={handleChange}
              disabled={disabled}
              required={required}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
              {...props}
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

            <div
              className={cn(
                'border flex items-center justify-center transition-all duration-200 pointer-events-none',
                activeSize.checkboxBox,
                isFocused && !disabled && 'ring-2 ring-[var(--color-ring)] ring-offset-1',
                disabled && 'opacity-40'
              )}
              style={{
                backgroundColor: isActive
                  ? error
                    ? 'var(--color-danger)'
                    : 'var(--color-primary)'
                  : 'transparent',
                borderColor: isActive
                  ? 'transparent'
                  : error
                    ? 'var(--color-danger)'
                    : 'color-mix(in srgb, var(--color-foreground) 62%, transparent)',
              }}
            >
              {isIndeterminate ? (
                <Minus
                  key={iconKey}
                  size={activeSize.iconSize}
                  strokeWidth={3.5}
                  className="cb-check-pop"
                  style={{ color: 'var(--color-primary-foreground)' }}
                />
              ) : isChecked ? (
                <Check
                  key={iconKey}
                  size={activeSize.iconSize}
                  strokeWidth={3.5}
                  className="cb-check-pop"
                  style={{ color: 'var(--color-primary-foreground)' }}
                />
              ) : null}
            </div>
          </div>

          {(label || description || hint || error) && (
            <div
              className={cn(
                'ml-0.5 flex flex-col justify-center min-w-0',
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              )}
              style={{
                paddingTop:
                  (activeSize.rippleZone - (size === 'sm' ? 16 : size === 'lg' ? 24 : 20)) / 2,
              }}
              onClick={handleToggle}
            >
              {label && (
                <span
                  className={cn(
                    'font-medium leading-none select-none',
                    activeSize.labelClass,
                    error ? 'text-[var(--color-danger)]' : 'text-[var(--color-foreground)]'
                  )}
                >
                  {label}
                  {required && (
                    <span className="ml-0.5 font-bold text-[var(--color-danger)]">*</span>
                  )}
                </span>
              )}

              {(error || description || hint) && (
                <div className="pointer-events-none flex flex-col gap-1 mt-1.5">
                  {error && (
                    <p className="text-xs font-medium text-[var(--color-danger)]">{error}</p>
                  )}
                  {description && !error && (
                    <p
                      className={cn(
                        'leading-normal select-none text-[var(--color-muted-foreground)]',
                        activeSize.descClass
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
          )}
        </div>

        {children && (
          <div
            className={cn(
              'flex flex-col gap-0.5 border-l border-[var(--color-border)]',
              activeSize.childIndent
            )}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export function CheckboxGroup({
  name,
  label,
  description,
  hint,
  error,
  disabled,
  size = 'md',
  className,
  items,
  checkedIds: controlledIds,
  onCheckedIdsChange,
  defaultCheckedIds,
  children,
}: CheckboxGroupProps) {
  const [internalIds, setInternalIds] = React.useState<Set<string>>(
    () => defaultCheckedIds ?? new Set()
  );

  const isControlled = controlledIds !== undefined;
  const checkedIds = isControlled ? controlledIds : internalIds;

  const setCheckedIds = (next: Set<string>) => {
    if (!isControlled) setInternalIds(new Set(next));
    onCheckedIdsChange?.(next);
  };

  const [registeredItems, setRegisteredItems] = React.useState<Map<string, boolean>>(
    () => new Map()
  );

  const registerId = React.useCallback((id: string, disabled: boolean) => {
    setRegisteredItems((prev) => {
      const next = new Map(prev);
      next.set(id, disabled);
      return next;
    });
    return () => {
      setRegisteredItems((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    };
  }, []);

  const enabledItems = Array.from(registeredItems.entries()).filter(([_, disabled]) => !disabled);
  const enabledIds = enabledItems.map(([id]) => id);

  const allChecked = enabledIds.length > 0 && enabledIds.every((id) => checkedIds.has(id));
  const someChecked = enabledIds.some((id) => checkedIds.has(id));
  const indeterminate = someChecked && !allChecked;

  const toggleId = React.useCallback(
    (id: string, checked: boolean) => {
      const next = new Set(checkedIds);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      setCheckedIds(next);
    },
    [checkedIds]
  );

  const toggleAll = React.useCallback(
    (checked: boolean) => {
      const next = new Set(checkedIds);
      if (checked || indeterminate) {
        enabledIds.forEach((id) => next.add(id));
      } else {
        enabledIds.forEach((id) => next.delete(id));
      }
      setCheckedIds(next);
    },
    [checkedIds, enabledIds, indeterminate]
  );

  const contextValue = React.useMemo(
    () => ({
      name,
      checkedIds,
      toggleId,
      toggleAll,
      allChecked,
      indeterminate,
      registerId,
    }),
    [name, checkedIds, toggleId, toggleAll, allChecked, indeterminate, registerId]
  );

  if (items) {
    return (
      <CheckboxGroupContext.Provider value={contextValue}>
        <Checkbox
          isGroupParent
          label={label}
          description={description}
          hint={hint}
          error={error}
          disabled={disabled}
          size={size}
          className={className}
        >
          {items.map((item) => (
            <Checkbox
              key={item.id}
              value={item.id}
              label={item.label}
              description={item.description}
              hint={item.hint}
              error={item.error}
              disabled={disabled || item.disabled}
              size={size}
            />
          ))}
        </Checkbox>
      </CheckboxGroupContext.Provider>
    );
  }

  return (
    <CheckboxGroupContext.Provider value={contextValue}>{children}</CheckboxGroupContext.Provider>
  );
}
