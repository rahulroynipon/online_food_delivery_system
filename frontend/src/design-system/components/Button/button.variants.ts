import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] active:translate-y-px overflow-hidden select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] shadow-sm',
        secondary:
          'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)] shadow-sm',
        danger:
          'bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:bg-[var(--color-danger-hover)] shadow-sm',
        outline:
          'border border-[var(--color-primary)] bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-accent)]',
        ghost: 'bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-accent)]',
        link: 'bg-transparent text-[var(--color-primary)] underline-offset-4 hover:underline',
        tertiary:
          'bg-[color-mix(in_srgb,var(--color-foreground)_8%,transparent)] text-[var(--color-foreground)] hover:bg-[color-mix(in_srgb,var(--color-foreground)_15%,transparent)]',
        'danger-soft':
          'bg-[color-mix(in_srgb,var(--color-danger)_15%,transparent)] text-[var(--color-danger)] hover:bg-[color-mix(in_srgb,var(--color-danger)_20%,transparent)]',
        unstyled: '',
      },
      size: {
        md: 'h-10 px-4 py-2 text-sm gap-2',
        xs: 'h-7 px-2 text-xs gap-1',
        sm: 'h-8 px-3 text-xs gap-1.5',
        lg: 'h-11 px-8 text-base gap-3',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-xs': 'h-7 w-7 p-0',
        'icon-xxs': 'h-6 w-6 p-0',
      },
      rounded: {
        none: 'rounded-[var(--radius-none)]',
        sm: 'rounded-[var(--radius-sm)]',
        md: 'rounded-[var(--radius-md)]',
        lg: 'rounded-[var(--radius-lg)]',
        full: 'rounded-[var(--radius-full)]',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      rounded: 'md',
      fullWidth: false,
    },
  }
);
