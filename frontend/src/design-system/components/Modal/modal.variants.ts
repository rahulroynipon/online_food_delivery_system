import { cva } from 'class-variance-authority';

export const modalPanelVariants = cva(
  'relative w-full bg-[var(--color-card)] text-[var(--color-foreground)] shadow-xl flex flex-col max-h-[90vh] border-0 overflow-hidden',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]',
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
      rounded: 'lg',
    },
  }
);

export type ModalPanelVariantsProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
};
