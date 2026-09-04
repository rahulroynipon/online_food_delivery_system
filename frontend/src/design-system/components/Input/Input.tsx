'use client';

import * as React from 'react';
import { cn } from '@/design-system/utils/utils';
import { Check, Copy, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { Button } from '../Button';

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'prefix'
> {
  label?: string;
  description?: string;
  hint?: string;
  error?: string;
  loading?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  clearable?: boolean;
  passwordToggle?: boolean;
  copyable?: boolean;
  showCount?: boolean;
  inputClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      description,
      hint,
      error,
      required,
      disabled,
      readOnly,
      loading,
      size = 'md',
      rounded = 'md',
      leftIcon,
      rightIcon,
      prefix,
      suffix,
      clearable = false,
      passwordToggle = false,
      copyable = false,
      showCount = false,
      maxLength,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      id,
      inputClassName,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const isControlled = value !== undefined;
    const [localValue, setLocalValue] = React.useState((defaultValue ?? '') as string);
    const resolvedValue = isControlled ? (value as string) : localValue;
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setLocalValue(e.target.value);
      }
      if (onChange) onChange(e);
    };

    const handleClear = () => {
      if (!isControlled) {
        setLocalValue('');
      }
      if (inputRef.current) {
        inputRef.current.value = '';
        const event = {
          target: inputRef.current,
          currentTarget: inputRef.current,
        } as React.ChangeEvent<HTMLInputElement>;
        if (onChange) onChange(event);
        inputRef.current.focus();
      }
    };

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(String(resolvedValue));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    };

    const isPassword = type === 'password';
    const resolvedType = isPassword && showPassword ? 'text' : type;

    const wrapperSizeClasses = {
      xs: 'h-7',
      sm: 'h-8',
      md: 'h-[38px]',
      lg: 'h-11',
    };

    const inputSizeClasses = {
      xs: 'text-xs px-2',
      sm: 'text-xs px-2.5',
      md: 'text-sm px-3',
      lg: 'text-base px-4',
    };

    const roundnessMap = {
      none: 'rounded-[var(--radius-none)]',
      sm: 'rounded-[var(--radius-sm)]',
      md: 'rounded-[var(--radius-md)]',
      lg: 'rounded-[var(--radius-lg)]',
      full: 'rounded-[var(--radius-full)]',
    };

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', className)}>
        {(label || showCount) && (
          <div className="flex items-center justify-between">
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  'text-sm font-medium flex items-center gap-0.5 select-none',
                  error ? 'text-[var(--color-danger)]' : 'text-[var(--color-foreground)]'
                )}
              >
                {label}
                {required && <span className="font-bold text-[var(--color-danger)]">*</span>}
              </label>
            )}
            {showCount && maxLength && (
              <span className="text-xs font-mono text-[var(--color-muted-foreground)]">
                {String(resolvedValue).length}/{maxLength}
              </span>
            )}
          </div>
        )}

        <div
          className={cn(
            'relative flex items-center w-full border transition-all overflow-hidden bg-[var(--color-field-bg)] text-[var(--color-foreground)]',
            wrapperSizeClasses[size],
            roundnessMap[rounded],
            disabled && 'opacity-50 cursor-not-allowed',
            readOnly && 'bg-[var(--color-muted)]/50',
            error
              ? 'border-[var(--color-danger)]'
              : isFocused
                ? 'border-[var(--color-ring)] ring-1 ring-[var(--color-ring)]'
                : 'border-[var(--color-input)] hover:border-[var(--color-border)]'
          )}
        >
          {prefix && (
            <div className="flex items-center justify-center border-r border-[var(--color-border)] select-none h-full px-3 text-sm font-medium bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
              {prefix}
            </div>
          )}

          <div className="relative flex-1 flex items-center h-full">
            {leftIcon && (
              <div className="absolute left-3 pointer-events-none flex items-center justify-center text-[var(--color-muted-foreground)]">
                {leftIcon}
              </div>
            )}

            <input
              ref={inputRef}
              type={resolvedType}
              id={inputId}
              disabled={disabled}
              readOnly={readOnly}
              maxLength={maxLength}
              {...props}
              {...(isControlled ? { value: resolvedValue } : { defaultValue })}
              onChange={handleInputChange}
              onFocus={(e) => {
                setIsFocused(true);
                if (onFocus) onFocus(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                if (onBlur) onBlur(e);
              }}
              className={cn(
                'w-full h-full bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-[var(--color-muted-foreground)]/60 disabled:cursor-not-allowed',
                inputSizeClasses[size],
                leftIcon &&
                  (size === 'xs' || size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-11' : 'pl-9'),
                (rightIcon || clearable || passwordToggle || copyable || loading) &&
                  (size === 'xs' || size === 'sm' ? 'pr-8' : size === 'lg' ? 'pr-11' : 'pr-9'),
                inputClassName
              )}
            />

            <div className="absolute right-3 flex items-center gap-1.5 select-none text-[var(--color-muted-foreground)]">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}

              {!loading && clearable && localValue && !disabled && !readOnly && (
                <Button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={handleClear}
                  rounded="full"
                  size="icon-xxs"
                  variant="ghost"
                  className="hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}

              {!loading && isPassword && passwordToggle && !disabled && (
                <Button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => setShowPassword((prev) => !prev)}
                  rounded="full"
                  size="icon-xxs"
                  variant="ghost"
                  className="hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              )}

              {!loading && copyable && localValue && (
                <Button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={handleCopy}
                  rounded="full"
                  size="icon-xxs"
                  variant="ghost"
                  className="hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-[var(--color-success)]" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              )}

              {!loading && rightIcon && (
                <div className="flex items-center justify-center pointer-events-none">
                  {rightIcon}
                </div>
              )}
            </div>
          </div>

          {suffix && (
            <div className="flex items-center justify-center border-l border-[var(--color-border)] select-none h-full px-3 text-sm font-medium bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
              {suffix}
            </div>
          )}
        </div>

        {(error || description || hint) && (
          <div className="pointer-events-none flex flex-col gap-1">
            {error && <p className="text-xs font-medium text-[var(--color-danger)]">{error}</p>}
            {description && !error && (
              <p className="text-xs leading-normal text-[var(--color-muted-foreground)]">
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

Input.displayName = 'Input';
export { Input };
