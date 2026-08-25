'use client';

import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { cn } from '@/design-system/utils/utils';
import type {
  TooltipContentProps,
  TooltipProps,
  TooltipProviderProps,
  TooltipTriggerProps,
} from './tooltip.types';
import { tooltipContentVariants } from './tooltip.variants';
import './tooltip.css';

// Re-export types for backward compatibility
export * from './tooltip.types';

function TooltipProvider({ delayDuration = 0, ...props }: TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  children,
  content,
  side,
  sideOffset,
  align,
  alignOffset,
  arrowPadding,
  contentClassName,
  contentStyle,
  className,
  style,
  ...props
}: TooltipProps) {
  if (content !== undefined) {
    return (
      <TooltipPrimitive.Root data-slot="tooltip" {...props}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          sideOffset={sideOffset}
          align={align}
          alignOffset={alignOffset}
          arrowPadding={arrowPadding}
          className={cn(contentClassName, className)}
          style={{ ...contentStyle, ...style }}
        >
          {content}
        </TooltipContent>
      </TooltipPrimitive.Root>
    );
  }
  return (
    <TooltipPrimitive.Root data-slot="tooltip" {...props}>
      {children}
    </TooltipPrimitive.Root>
  );
}

function TooltipTrigger({ ...props }: TooltipTriggerProps) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

const ARROW_W = 11;
const ARROW_H = 6;

function TooltipContent({
  className,
  sideOffset = 6,
  arrowPadding,
  align = 'center',
  alignOffset,
  side = 'top',
  children,
  ...props
}: TooltipContentProps) {
  const arrowInset = 10;
  const arrowX =
    align === 'start'
      ? `${arrowInset}px`
      : align === 'end'
        ? `calc(100% - ${arrowInset + ARROW_W}px)`
        : `calc(50% - ${ARROW_W / 2}px)`;

  const arrowY = `calc(50% - ${ARROW_H / 2}px)`;

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset + ARROW_H}
        arrowPadding={0}
        alignOffset={alignOffset}
        side={side}
        align={align}
        className={cn(tooltipContentVariants(), className)}
        style={{
          transformOrigin: 'var(--radix-tooltip-content-transform-origin)',
          overflow: 'visible',
          ...props.style,
        }}
        {...props}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
          [data-slot="tooltip-content"][data-side="top"] [data-slot="tooltip-arrow"] {
            bottom: -${ARROW_H}px;
            left: ${arrowX};
            transform: none;
          }
          [data-slot="tooltip-content"][data-side="bottom"] [data-slot="tooltip-arrow"] {
            top: -${ARROW_H}px;
            left: ${arrowX};
            transform: rotate(180deg);
          }
          [data-slot="tooltip-content"][data-side="left"] [data-slot="tooltip-arrow"] {
            right: -${ARROW_H + 2.5}px;
            top: ${arrowY};
            transform: rotate(-90deg);
          }
          [data-slot="tooltip-content"][data-side="right"] [data-slot="tooltip-arrow"] {
            left: -${ARROW_H + 2.5}px;
            top: ${arrowY};
            transform: rotate(90deg);
          }
        `,
          }}
        />

        {children}

        <svg
          data-slot="tooltip-arrow"
          width={ARROW_W}
          height={ARROW_H}
          viewBox="0 0 11 6"
          xmlns="http://www.w3.org/2000/svg"
          className="fill-[var(--color-foreground)] dark:fill-[var(--color-card)]"
          style={{
            position: 'absolute',
            display: 'block',
            pointerEvents: 'none',
          }}
        >
          <path d="M0 0L5.5 6L11 0H0Z" />
        </svg>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

(Tooltip as any).Trigger = TooltipTrigger;
(Tooltip as any).Content = TooltipContent;
(Tooltip as any).Provider = TooltipProvider;

const TooltipComponent = Tooltip as typeof Tooltip & {
  Trigger: typeof TooltipTrigger;
  Content: typeof TooltipContent;
  Provider: typeof TooltipProvider;
};

export { TooltipComponent as Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
export default TooltipComponent;
