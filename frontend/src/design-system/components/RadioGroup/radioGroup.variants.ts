import { cva } from 'class-variance-authority';

export const SIZE = {
  xs: {
    ring: 14,
    dot: 6,
    rippleZone: 26,
    label: 'text-xs font-normal',
    desc: 'text-[10px]',
    gap: 'gap-1.5',
  },
  sm: {
    ring: 16,
    dot: 8,
    rippleZone: 32,
    label: 'text-xs font-normal',
    desc: 'text-[11px]',
    gap: 'gap-2',
  },
  md: {
    ring: 20,
    dot: 10,
    rippleZone: 38,
    label: 'text-sm font-normal',
    desc: 'text-xs',
    gap: 'gap-2.5',
  },
  lg: {
    ring: 24,
    dot: 12,
    rippleZone: 44,
    label: 'text-base font-normal',
    desc: 'text-xs',
    gap: 'gap-3',
  },
  icon: {
    ring: 20,
    dot: 10,
    rippleZone: 38,
    label: 'sr-only',
    desc: 'sr-only',
    gap: 'gap-0',
  },
} as const;
