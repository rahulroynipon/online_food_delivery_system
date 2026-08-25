import { cva } from 'class-variance-authority';

export const textareaVariants = cva(
  'w-full border placeholder:text-[var(--color-muted-foreground)]/60 outline-none focus:outline-none disabled:cursor-not-allowed text-[var(--color-foreground)] transition-all',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-field-bg)]',
        filled: 'bg-[var(--color-muted)]',
        ghost: 'bg-transparent',
      },
      size: {
        sm: 'text-xs px-2.5 py-2',
        md: 'text-sm px-3 py-2',
        lg: 'text-base px-4 py-2.5',
      },
      rounded: {
        none: 'rounded-[var(--radius-none)]',
        sm: 'rounded-[var(--radius-sm)]',
        md: 'rounded-[var(--radius-md)]',
        lg: 'rounded-[var(--radius-lg)]',
        full: 'rounded-[var(--radius-full)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      rounded: 'md',
    },
  }
);
