import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-full border transition-all duration-200 leading-none shrink-0 relative',
  {
    variants: {
      variant: {
        solid: 'border-transparent',
        soft: 'border-transparent',
        outline: 'bg-transparent',
        // Legacy semantic variants (mapped to soft style by default for backward compatibility)
        default:
          'border-transparent bg-[color-mix(in_srgb,var(--color-foreground)_10%,transparent)] text-[var(--color-foreground)] border-[var(--color-border)]',
        primary:
          'border-transparent bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]',
        secondary:
          'border-transparent bg-[color-mix(in_srgb,var(--color-secondary)_12%,transparent)] text-[var(--color-secondary)]',
        success:
          'border-transparent bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] text-[var(--color-success)]',
        warning:
          'border-transparent bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] text-[var(--color-warning)]',
        danger:
          'border-transparent bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] text-[var(--color-danger)]',
        error:
          'border-transparent bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] text-[var(--color-danger)]',
        info: 'border-transparent bg-[color-mix(in_srgb,var(--color-info)_12%,transparent)] text-[var(--color-info)]',
        neutral:
          'border-transparent bg-[color-mix(in_srgb,var(--color-foreground)_10%,transparent)] text-[var(--color-foreground)] border-[var(--color-border)]',
        unstyled: '',
      },
      color: {
        default: '',
        primary: '',
        secondary: '',
        success: '',
        warning: '',
        danger: '',
        info: '',
        neutral: '',
      },
      size: {
        xs: 'text-[10px] px-1.5 h-4.5 min-w-[18px]',
        sm: 'text-xs px-2 h-5 min-w-[20px]',
        md: 'text-xs px-2.5 h-5.5 min-w-[22px]',
        lg: 'text-sm px-3 h-6 min-w-[24px]',
        dot: 'p-0 min-w-0 min-h-0 rounded-full',
      },
    },
    compoundVariants: [
      // Primary
      {
        variant: 'solid',
        color: 'primary',
        className: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
      },
      {
        variant: 'soft',
        color: 'primary',
        className:
          'bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]',
      },
      {
        variant: 'outline',
        color: 'primary',
        className:
          'text-[var(--color-primary)] border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)]',
      },

      // Secondary
      {
        variant: 'solid',
        color: 'secondary',
        className: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
      },
      {
        variant: 'soft',
        color: 'secondary',
        className:
          'bg-[color-mix(in_srgb,var(--color-secondary)_12%,transparent)] text-[var(--color-secondary)]',
      },
      {
        variant: 'outline',
        color: 'secondary',
        className:
          'text-[var(--color-secondary)] border-[color-mix(in_srgb,var(--color-secondary)_30%,transparent)]',
      },

      // Success
      {
        variant: 'solid',
        color: 'success',
        className: 'bg-[var(--color-success)] text-[var(--color-success-foreground)]',
      },
      {
        variant: 'soft',
        color: 'success',
        className:
          'bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] text-[var(--color-success)]',
      },
      {
        variant: 'outline',
        color: 'success',
        className:
          'text-[var(--color-success)] border-[color-mix(in_srgb,var(--color-success)_30%,transparent)]',
      },

      // Warning
      {
        variant: 'solid',
        color: 'warning',
        className: 'bg-[var(--color-warning)] text-[var(--color-warning-foreground)]',
      },
      {
        variant: 'soft',
        color: 'warning',
        className:
          'bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] text-[var(--color-warning)]',
      },
      {
        variant: 'outline',
        color: 'warning',
        className:
          'text-[var(--color-warning)] border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)]',
      },

      // Danger
      {
        variant: 'solid',
        color: 'danger',
        className: 'bg-[var(--color-danger)] text-[var(--color-danger-foreground)]',
      },
      {
        variant: 'soft',
        color: 'danger',
        className:
          'bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] text-[var(--color-danger)]',
      },
      {
        variant: 'outline',
        color: 'danger',
        className:
          'text-[var(--color-danger)] border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)]',
      },

      // Info
      {
        variant: 'solid',
        color: 'info',
        className: 'bg-[var(--color-info)] text-[var(--color-info-foreground)]',
      },
      {
        variant: 'soft',
        color: 'info',
        className:
          'bg-[color-mix(in_srgb,var(--color-info)_12%,transparent)] text-[var(--color-info)]',
      },
      {
        variant: 'outline',
        color: 'info',
        className:
          'text-[var(--color-info)] border-[color-mix(in_srgb,var(--color-info)_30%,transparent)]',
      },

      // Neutral
      {
        variant: 'solid',
        color: 'neutral',
        className: 'bg-[var(--color-foreground)] text-[var(--color-background)]',
      },
      {
        variant: 'soft',
        color: 'neutral',
        className:
          'bg-[color-mix(in_srgb,var(--color-foreground)_10%,transparent)] text-[var(--color-foreground)]',
      },
      {
        variant: 'outline',
        color: 'neutral',
        className: 'text-[var(--color-foreground)] border-[var(--color-border)]',
      },

      // Default (Foreground/Border based)
      {
        variant: 'solid',
        color: 'default',
        className: 'bg-[var(--color-foreground)] text-[var(--color-background)]',
      },
      {
        variant: 'soft',
        color: 'default',
        className:
          'bg-[color-mix(in_srgb,var(--color-foreground)_10%,transparent)] text-[var(--color-foreground)]',
      },
      {
        variant: 'outline',
        color: 'default',
        className: 'text-[var(--color-foreground)] border-[var(--color-border)]',
      },
    ],
    defaultVariants: {
      variant: 'soft',
      color: 'default',
      size: 'sm',
    },
  }
);
