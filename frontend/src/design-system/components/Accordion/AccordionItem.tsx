import * as React from 'react';
import { AccordionItemProps } from './accordion.types';
import { AccordionItemContext, useAccordionContext } from './AccordionContext';
import { cn } from '@/design-system/utils/utils';

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, disabled = false, className, children, ...props }, ref) => {
    const { value: activeValues, disabled: parentDisabled } = useAccordionContext();

    const isItemDisabled = parentDisabled || disabled;
    const isOpen = activeValues.includes(value);

    const contextValue = React.useMemo(
      () => ({ value, disabled: isItemDisabled }),
      [value, isItemDisabled]
    );

    return (
      <AccordionItemContext.Provider value={contextValue}>
        <div
          ref={ref}
          data-state={isOpen ? 'open' : 'closed'}
          data-disabled={isItemDisabled ? '' : undefined}
          className={cn('accordion-item', className)}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);

AccordionItem.displayName = 'AccordionItem';
