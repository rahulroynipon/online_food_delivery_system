import * as React from 'react';
import { AccordionType } from './accordion.types';

export interface AccordionContextType {
  type: AccordionType;
  value: string[];
  toggleItem: (itemValue: string) => void;
  disabled?: boolean;
}

export const AccordionContext = React.createContext<AccordionContextType | null>(null);

export function useAccordionContext() {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be wrapped in <Accordion>');
  }
  return context;
}

export interface AccordionItemContextType {
  value: string;
  disabled?: boolean;
}

export const AccordionItemContext = React.createContext<AccordionItemContextType | null>(null);

export function useAccordionItemContext() {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error('Accordion item components must be wrapped in <AccordionItem>');
  }
  return context;
}
