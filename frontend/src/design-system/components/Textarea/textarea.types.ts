import * as React from 'react';
import type { VariantProps } from 'class-variance-authority';
import { textareaVariants } from './textarea.variants';

export interface TextareaProps
  extends
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size' | 'color'>,
    Omit<VariantProps<typeof textareaVariants>, 'variant' | 'size' | 'rounded'> {
  label?: string;
  description?: string;
  hint?: string;
  error?: string;
  variant?: 'default' | 'filled' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  showCount?: boolean;
  resize?: boolean;
}
