import * as React from 'react';
import { AccordionContentProps } from './accordion.types';
import { useAccordionContext, useAccordionItemContext } from './AccordionContext';
import { cn } from '@/design-system/utils/utils';

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, forceMount = false, ...props }, ref) => {
    const { value: activeValues } = useAccordionContext();
    const { value: itemValue } = useAccordionItemContext();

    const isOpen = activeValues.includes(itemValue);
    const [hasRendered, setHasRendered] = React.useState(isOpen);

    React.useEffect(() => {
      if (isOpen && !hasRendered) {
        setHasRendered(true);
      }
    }, [isOpen, hasRendered]);

    // Lazy load content: don't mount until it has been opened at least once (unless forceMount is active)
    const shouldRenderContent = forceMount || hasRendered;

    return (
      <div
        ref={ref}
        data-state={isOpen ? 'open' : 'closed'}
        className={cn('accordion-content-wrapper', className)}
        role="region"
        {...props}
      >
        <div className="accordion-content-inner">
          {shouldRenderContent && <div className="accordion-content-body">{children}</div>}
        </div>
      </div>
    );
  }
);

AccordionContent.displayName = 'AccordionContent';
