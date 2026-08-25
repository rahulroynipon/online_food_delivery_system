import * as React from 'react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';

export type TooltipProviderProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>;
export type TooltipProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> & {
  content?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
  arrowPadding?: number;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  className?: string;
  style?: React.CSSProperties;
};
export type TooltipTriggerProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>;

export interface TooltipContentProps extends React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Content
> {
  arrowPadding?: number;
}
