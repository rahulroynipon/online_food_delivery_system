import { cva } from 'class-variance-authority';

export const alertVariants = cva(
  'flex items-start w-full relative shadow-sm overflow-hidden transition-all duration-200 border',
  {
    variants: {
      variant: {
        soft: '',
        filled: 'border-transparent',
        outline: 'bg-transparent',
        unstyled: '',
      },
      severity: {
        info: '',
        success: '',
        warning: '',
        error: '',
      },
      size: {
        sm: 'px-3 py-2 text-xs gap-2',
        md: 'px-4 py-3 text-sm gap-3',
        lg: 'px-5 py-4 text-base gap-4',
      },
      rounded: {
        none: 'rounded-[var(--radius-none)]',
        sm: 'rounded-[var(--radius-sm)]',
        md: 'rounded-[var(--radius-md)]',
        lg: 'rounded-[var(--radius-lg)]',
        full: 'rounded-[var(--radius-full)]',
      },
    },
    compoundVariants: [
      // Info
      {
        variant: 'filled',
        severity: 'info',
        className: 'bg-[var(--color-info)] text-white',
      },
      {
        variant: 'soft',
        severity: 'info',
        className:
          'bg-[color-mix(in_srgb,var(--color-info)_12%,transparent)] text-[var(--color-info)] border-[color-mix(in_srgb,var(--color-info)_25%,transparent)]',
      },
      {
        variant: 'outline',
        severity: 'info',
        className: 'text-[var(--color-info)] border-[var(--color-info)]',
      },

      // Success
      {
        variant: 'filled',
        severity: 'success',
        className: 'bg-[var(--color-success)] text-white',
      },
      {
        variant: 'soft',
        severity: 'success',
        className:
          'bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] text-[var(--color-success)] border-[color-mix(in_srgb,var(--color-success)_25%,transparent)]',
      },
      {
        variant: 'outline',
        severity: 'success',
        className: 'text-[var(--color-success)] border-[var(--color-success)]',
      },

      // Warning
      {
        variant: 'filled',
        severity: 'warning',
        className: 'bg-[var(--color-warning)] text-white',
      },
      {
        variant: 'soft',
        severity: 'warning',
        className:
          'bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] text-[var(--color-warning)] border-[color-mix(in_srgb,var(--color-warning)_25%,transparent)]',
      },
      {
        variant: 'outline',
        severity: 'warning',
        className: 'text-[var(--color-warning)] border-[var(--color-warning)]',
      },

      // Error (Danger)
      {
        variant: 'filled',
        severity: 'error',
        className: 'bg-[var(--color-danger)] text-white',
      },
      {
        variant: 'soft',
        severity: 'error',
        className:
          'bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] text-[var(--color-danger)] border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)]',
      },
      {
        variant: 'outline',
        severity: 'error',
        className: 'text-[var(--color-danger)] border-[var(--color-danger)]',
      },
    ],
    defaultVariants: {
      variant: 'soft',
      severity: 'info',
      size: 'md',
      rounded: 'md',
    },
  }
);
