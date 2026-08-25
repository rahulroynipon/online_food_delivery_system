import { cva } from 'class-variance-authority';

// ── Item base ─────────────────────────────────────────────────────────────────

export const toggleGroupItemVariants = cva(
  [
    'relative inline-flex items-center justify-center gap-1.5 font-medium border',
    'transition-all duration-150 select-none cursor-pointer overflow-hidden',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
  ].join(' '),
  {
    variants: {
      size: {
        xs: 'h-7 px-2.5 text-[10px]',
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-10 px-5 text-base',
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
      size: 'md',
      rounded: 'md',
    },
  }
);

// ── Variant × selected look-up ───────────────────────────────────────────────

export const variantSelected: Record<string, string> = {
  outline:
    'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]',
  filled:
    'border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm',
  pill: 'border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm',
  ghost:
    'border-transparent bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[var(--color-primary)]',
};

export const variantUnselected: Record<string, string> = {
  outline:
    'border-[var(--color-border)] bg-transparent text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]',
  filled:
    'border-transparent bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[color-mix(in_srgb,var(--color-muted)_80%,var(--color-foreground)_6%)]',
  pill: 'border-transparent bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
  ghost:
    'border-transparent bg-transparent text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]',
};

// Pill variant forces full radius regardless of the `rounded` prop
export const variantPillOverride: Record<string, string> = {
  pill: '!rounded-[var(--radius-full)]',
};
