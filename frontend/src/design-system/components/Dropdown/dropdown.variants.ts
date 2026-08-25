import { cva } from 'class-variance-authority';

export const dropdownTriggerVariants = cva(
  'flex items-center gap-2 rounded-[var(--radius-md)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
  {
    variants: {},
    defaultVariants: {},
  }
);

export const dropdownItemVariants = cva(
  'group flex items-center w-full px-2 py-1.5 rounded-[var(--radius-sm)] text-sm transition-all duration-75 active:scale-[0.98] text-left select-none outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default:
          'text-[var(--color-foreground)] hover:bg-[color-mix(in_srgb,var(--color-accent)_50%,transparent)] hover:text-[var(--color-accent-foreground)]',
        danger:
          'text-[var(--color-danger)] hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] hover:text-[var(--color-danger)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type DropdownTriggerVariantsProps = {};
export type DropdownItemVariantsProps = {
  variant?: 'default' | 'danger';
};
