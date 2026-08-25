import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { AccordionTriggerProps } from './accordion.types';
import { useAccordionContext, useAccordionItemContext } from './AccordionContext';
import { cn } from '@/design-system/utils/utils';

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, iconPosition = 'right', chevron, onClick, onKeyDown, ...props }, ref) => {
    const { value: activeValues, toggleItem } = useAccordionContext();
    const { value: itemValue, disabled: itemDisabled } = useAccordionItemContext();

    const isOpen = activeValues.includes(itemValue);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (itemDisabled) return;
      toggleItem(itemValue);
      onClick?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (itemDisabled) return;

      const root = e.currentTarget.closest('.accordion-root');
      if (!root) return;

      const triggers = Array.from(
        root.querySelectorAll('.accordion-trigger:not([data-disabled="true"]):not(:disabled)')
      ) as HTMLButtonElement[];

      const index = triggers.indexOf(e.currentTarget);
      if (index === -1) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          triggers[(index + 1) % triggers.length]?.focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          triggers[(index - 1 + triggers.length) % triggers.length]?.focus();
          break;
        case 'Home':
          e.preventDefault();
          triggers[0]?.focus();
          break;
        case 'End':
          e.preventDefault();
          triggers[triggers.length - 1]?.focus();
          break;
      }

      onKeyDown?.(e);
    };

    const renderedChevron =
      chevron !== undefined ? chevron : <ChevronDown size={16} className="accordion-chevron" />;

    return (
      <button
        ref={ref}
        type="button"
        disabled={itemDisabled}
        data-state={isOpen ? 'open' : 'closed'}
        data-disabled={itemDisabled ? 'true' : undefined}
        className={cn('accordion-trigger', className)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-disabled={itemDisabled || undefined}
        {...props}
      >
        {iconPosition === 'left' && renderedChevron}
        <span className="flex-1 text-left">{children}</span>
        {iconPosition === 'right' && renderedChevron}
      </button>
    );
  }
);

AccordionTrigger.displayName = 'AccordionTrigger';
