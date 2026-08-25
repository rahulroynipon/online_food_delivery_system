import * as React from 'react';
import {
  AccordionProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionContentProps,
} from './accordion.types';
import { AccordionContext } from './AccordionContext';
import { AccordionItem } from './AccordionItem';
import { AccordionTrigger } from './AccordionTrigger';
import { AccordionContent } from './AccordionContent';
import { cn } from '@/design-system/utils/utils';
import './accordion.css';

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      type = 'single',
      value,
      defaultValue,
      onValueChange,
      collapsible = true,
      disabled = false,
      items,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState<string[]>(() => {
      if (defaultValue !== undefined) {
        return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
      }
      return [];
    });

    const isControlled = value !== undefined;
    const activeValue = React.useMemo(() => {
      if (isControlled) {
        return Array.isArray(value) ? value : value ? [value] : [];
      }
      return internalValue;
    }, [isControlled, value, internalValue]);

    const toggleItem = React.useCallback(
      (itemValue: string) => {
        let nextValue: string[];

        if (type === 'single') {
          if (activeValue.includes(itemValue)) {
            nextValue = collapsible ? [] : activeValue;
          } else {
            nextValue = [itemValue];
          }
        } else {
          if (activeValue.includes(itemValue)) {
            nextValue = activeValue.filter((val) => val !== itemValue);
          } else {
            nextValue = [...activeValue, itemValue];
          }
        }

        if (!isControlled) {
          setInternalValue(nextValue);
        }

        if (onValueChange) {
          onValueChange(type === 'single' ? (nextValue[0] ?? '') : nextValue);
        }
      },
      [type, collapsible, activeValue, isControlled, onValueChange]
    );

    const contextValue = React.useMemo(
      () => ({ type, value: activeValue, toggleItem, disabled }),
      [type, activeValue, toggleItem, disabled]
    );

    return (
      <AccordionContext.Provider value={contextValue}>
        <div ref={ref} className={cn('accordion-root', className)} {...props}>
          {items && items.length > 0
            ? items.map((item) => (
                <AccordionItem key={item.value} value={item.value} disabled={item.disabled}>
                  <AccordionTrigger>{item.title}</AccordionTrigger>
                  <AccordionContent>{item.content}</AccordionContent>
                </AccordionItem>
              ))
            : children}
        </div>
      </AccordionContext.Provider>
    );
  }
);

Accordion.displayName = 'Accordion';
export { AccordionItem, AccordionTrigger, AccordionContent };
export type { AccordionProps, AccordionItemProps, AccordionTriggerProps, AccordionContentProps };
