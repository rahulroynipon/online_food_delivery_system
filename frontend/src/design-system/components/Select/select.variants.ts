import { cva } from 'class-variance-authority';

export const selectTriggerVariants = cva(
  'w-full flex items-center justify-between border cursor-pointer select-none text-left outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-field-bg)] text-[var(--color-foreground)]',
  {
    variants: {
      size: {
        xs: 'min-h-[28px] text-xs px-2 py-0.5',
        sm: 'min-h-[32px] text-xs px-2.5 py-1',
        md: 'min-h-[38px] text-sm px-3 py-1.5',
        lg: 'min-h-[44px] text-base px-4 py-2',
      },
      rounded: {
        none: 'rounded-[var(--radius-none)]',
        sm: 'rounded-[var(--radius-sm)]',
        md: 'rounded-[var(--radius-md)]',
        lg: 'rounded-[var(--radius-lg)]',
        full: 'rounded-[var(--radius-full)]',
      },
      hasError: {
        true: 'border-[var(--color-danger)]',
        false: 'border-[var(--color-input)] hover:border-[var(--color-border)]',
      },
    },
    defaultVariants: {
      size: 'md',
      rounded: 'md',
      hasError: false,
    },
  }
);

export const roundnessMap = {
  none: 'rounded-[var(--radius-none)]',
  sm: 'rounded-[var(--radius-sm)]',
  md: 'rounded-[var(--radius-md)]',
  lg: 'rounded-[var(--radius-lg)]',
  full: 'rounded-[var(--radius-full)]',
};
