import { cva } from 'class-variance-authority';

export const drawerOverlayVariants = cva(
  'fixed inset-0 z-[9999] bg-black/40 backdrop-blur-xs transition-opacity duration-300',
  {
    variants: {
      open: {
        true: 'opacity-100 pointer-events-auto',
        false: 'opacity-0 pointer-events-none',
      },
    },
    defaultVariants: {
      open: false,
    },
  }
);

export const drawerContentVariants = cva(
  'fixed z-[9999] bg-[var(--color-card)] text-[var(--color-foreground)] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-0',
  {
    variants: {
      side: {
        left: 'inset-y-0 left-0 border-r border-[var(--color-border)]',
        right: 'inset-y-0 right-0 border-l border-[var(--color-border)]',
        top: 'inset-x-0 top-0 border-b border-[var(--color-border)]',
        bottom: 'inset-x-0 bottom-0 border-t border-[var(--color-border)]',
      },
      open: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        side: 'left',
        open: true,
        class: 'translate-x-0',
      },
      {
        side: 'left',
        open: false,
        class: '-translate-x-full',
      },
      {
        side: 'right',
        open: true,
        class: 'translate-x-0',
      },
      {
        side: 'right',
        open: false,
        class: 'translate-x-full',
      },
      {
        side: 'top',
        open: true,
        class: 'translate-y-0',
      },
      {
        side: 'top',
        open: false,
        class: '-translate-y-full',
      },
      {
        side: 'bottom',
        open: true,
        class: 'translate-y-0',
      },
      {
        side: 'bottom',
        open: false,
        class: 'translate-y-full',
      },
    ],
    defaultVariants: {
      side: 'right',
      open: false,
    },
  }
);
