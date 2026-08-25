import * as React from 'react';

export interface TimePickerProps {
  value?: string | Date;
  onChange?: (time: string) => void;
  format?: '12h' | '24h';
  showSeconds?: boolean;

  // Standard Form Input Fields
  label?: string;
  description?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;

  // Layout customization
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';

  // Interaction mode
  mode?: 'both' | 'write' | 'pick';

  // Styles
  className?: string;
  style?: React.CSSProperties;
}
