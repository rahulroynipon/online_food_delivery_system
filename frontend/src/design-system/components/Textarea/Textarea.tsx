'use client';

import * as React from 'react';
import { cn } from '@/design-system/utils/utils';
import type { TextareaProps } from './textarea.types';
import { textareaVariants } from './textarea.variants';
import './textarea.css';

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      description,
      hint,
      error,
      variant = 'default',
      size = 'md',
      rounded = 'md',
      showCount = false,
      resize = false,
      disabled,
      required,
      maxLength,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [localValue, setLocalValue] = React.useState((value ?? defaultValue ?? '') as string);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
      if (value !== undefined) {
        setLocalValue(value as string);
      }
    }, [value]);

    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLocalValue(e.target.value);
      if (onChange) onChange(e);
    };

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {(label || showCount) && (
          <div className="flex items-center justify-between">
            {label && (
              <label
                htmlFor={textareaId}
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
                {localValue.length}/{maxLength}
              </span>
            )}
          </div>
        )}

        <textarea
          ref={textareaRef}
          id={textareaId}
          disabled={disabled}
          maxLength={maxLength}
          {...props}
          {...(value !== undefined ? { value: localValue } : {})}
          onChange={handleTextareaChange}
          onFocus={(e) => {
            setIsFocused(true);
            if (textareaRef.current) {
              setLocalValue(textareaRef.current.value);
            }
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          rows={rows}
          className={cn(
            textareaVariants({ variant, size, rounded }),
            disabled && 'opacity-50 cursor-not-allowed',
            error
              ? 'border-[var(--color-danger)]'
              : isFocused
                ? 'border-[var(--color-ring)] ring-1 ring-[var(--color-ring)]'
                : variant === 'default'
                  ? 'border-input'
                  : 'border-transparent',
            !resize && 'resize-none',
            resize && 'resize-y',
            className
          )}
        />

        {error && <p className="text-xs font-medium text-[var(--color-danger)]">{error}</p>}
        {(description || hint) && !error && (
          <p className="text-xs leading-normal text-[var(--color-muted-foreground)]">
            {description || hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export { Textarea, type TextareaProps };
