import * as React from 'react';
import type { DateRange } from 'react-day-picker';

export interface DatePickerProps {
  mode?: 'single' | 'range' | 'month' | 'year';
  label?: string;
  description?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value?: Date | DateRange;
  onChange?: (date: any) => void;

  // Input Customization Props
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';

  // Calendar Specific Options
  numberOfMonths?: number;
  captionLayout?: 'label' | 'dropdown';
  startMonth?: Date;
  endMonth?: Date;
  disabledDates?: (date: Date) => boolean;

  // Interaction mode
  interactionMode?: 'both' | 'write' | 'pick';

  // Popover Alignment
  align?: 'start' | 'center' | 'end';

  // Styles
  className?: string;
  style?: React.CSSProperties;
}
