import { cva } from 'class-variance-authority';

export const tabsVariants = cva('', {
  variants: {
    variant: {
      line: 'relative flex items-center w-full border-b border-[var(--color-border)] select-none',
      pill: 'relative inline-flex items-center w-auto select-none shadow-inner bg-[color-mix(in_srgb,var(--color-foreground)_8%,var(--color-background))]',
    },
  },
  defaultVariants: {
    variant: 'line',
  },
});

export const tabsSizeStyles = {
  sm: {
    container: 'gap-1',
    tab: 'h-8 px-3 text-xs gap-1.5',
    pillContainer: 'h-8 p-0.5',
    pillTab: 'h-7 px-3 text-xs gap-1.5',
  },
  md: {
    container: 'gap-2',
    tab: 'h-[38px] px-4 text-sm gap-2',
    pillContainer: 'h-[38px] p-[3px]',
    pillTab: 'h-8 px-4 text-sm gap-2',
  },
  lg: {
    container: 'gap-3',
    tab: 'h-11 px-5 text-base gap-2.5',
    pillContainer: 'h-11 p-1',
    pillTab: 'h-9 px-5 text-base gap-2.5',
  },
};

export const tabsOuterRoundnessMap = {
  none: 'rounded-[var(--radius-none)]',
  sm: 'rounded-[var(--radius-sm)]',
  md: 'rounded-[var(--radius-md)]',
  lg: 'rounded-[var(--radius-lg)]',
  full: 'rounded-[var(--radius-full)]',
};

export const tabsInnerRoundnessMap = {
  none: 'rounded-[var(--radius-none)]',
  sm: 'rounded-[2px]',
  md: 'rounded-[var(--radius-sm)]',
  lg: 'rounded-[var(--radius-md)]',
  full: 'rounded-[var(--radius-full)]',
};
