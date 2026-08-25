import { cva } from 'class-variance-authority';

export const tooltipContentVariants = cva(
  'relative z-50 inline-flex w-fit max-w-xs items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs shadow-md bg-[var(--color-foreground)] text-[var(--color-background)] dark:bg-[var(--color-card)] dark:text-[var(--color-foreground)]',
  {
    variants: {},
    defaultVariants: {},
  }
);
export type TooltipContentVariantsProps = {};
