'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/design-system/utils/utils';
import { Calendar } from '../Calendar';
import { Input } from '../Input';
import { Button } from '../Button';
import { Dropdown, Menu, Trigger, useDropdown } from '../Dropdown';
import type { DateRange } from 'react-day-picker';
import type { DatePickerProps } from './datePicker.types';

// Date parsing helpers for manual keyboard entry
const parseDateString = (str: string): Date | null => {
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const month = parseInt(match[1], 10) - 1;
  const day = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  const date = new Date(year, month, day);
  if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
    return date;
  }
  return null;
};

const parseRangeString = (str: string): DateRange | null => {
  const parts = str.split('-').map((p) => p.trim());
  if (parts.length !== 2) return null;

  // Accept standard format from getInputValue: MM/DD/YYYY or LLL dd, yyyy
  // For robustness, check if standard MM/DD/YYYY first or try to parse
  const from = parseDateString(parts[0]) || new Date(parts[0]);
  const to = parseDateString(parts[1]) || new Date(parts[1]);

  if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
    return { from, to };
  }
  return null;
};

const parseMonthString = (str: string): Date | null => {
  const match = str.match(/^(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const month = parseInt(match[1], 10) - 1;
  const year = parseInt(match[2], 10);
  if (month >= 0 && month <= 11 && year >= 1000 && year <= 9999) {
    return new Date(year, month, 1);
  }
  return null;
};

const parseYearString = (str: string): Date | null => {
  const match = str.match(/^(\d{4})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  if (year >= 1000 && year <= 9999) {
    return new Date(year, 0, 1);
  }
  return null;
};

function MonthPicker({ value, onChange }: { value?: Date; onChange: (date: Date) => void }) {
  const { close } = useDropdown();
  const today = React.useMemo(() => new Date(), []);
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  const [step, setStep] = React.useState<'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = React.useState<number>(() => {
    return value instanceof Date ? value.getMonth() : today.getMonth();
  });
  const [activeYear, setActiveYear] = React.useState(() => {
    return value instanceof Date ? value.getFullYear() : today.getFullYear();
  });
  const [startYearPage, setStartYearPage] = React.useState(() => {
    const yr = value instanceof Date ? value.getFullYear() : today.getFullYear();
    return yr - (yr % 12);
  });

  React.useEffect(() => {
    if (value instanceof Date) {
      setActiveYear(value.getFullYear());
      setSelectedMonth(value.getMonth());
      const yr = value.getFullYear();
      setStartYearPage(yr - (yr % 12));
    } else {
      const today = new Date();
      setActiveYear(today.getFullYear());
      setSelectedMonth(today.getMonth());
      const yr = today.getFullYear();
      setStartYearPage(yr - (yr % 12));
    }
  }, [value]);

  React.useEffect(() => {
    setStep('month');
  }, []);

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const fullMonths = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    setStep('year');
  };

  const handleYearSelect = (year: number) => {
    const selectedDate = new Date(year, selectedMonth, 1);
    onChange(selectedDate);
    close();
    setStep('month');
  };

  const handlePrevClick = () => {
    if (step === 'month') {
      setActiveYear((prev) => prev - 1);
    } else {
      setStartYearPage((prev) => prev - 12);
    }
  };

  const handleNextClick = () => {
    if (step === 'month') {
      setActiveYear((prev) => prev + 1);
    } else {
      setStartYearPage((prev) => prev + 12);
    }
  };

  const years = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => startYearPage + i);
  }, [startYearPage]);

  return (
    <div className="p-1.5 w-[240px]">
      {/* Unified Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          type="button"
          onClick={() => setStep((prev) => (prev === 'month' ? 'year' : 'month'))}
          className="flex items-center gap-1 text-sm font-semibold select-none text-[var(--color-foreground)] hover:bg-accent px-2 py-1 rounded-md transition-colors"
        >
          {step === 'month' ? `${fullMonths[selectedMonth]} ${activeYear}` : 'Select Year'}
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 opacity-80 transition-transform duration-200 text-primary',
              step === 'year' && 'rotate-180'
            )}
          />
        </button>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handlePrevClick}
            className="hover:bg-accent text-primary shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleNextClick}
            className="hover:bg-accent text-primary shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid Content */}
      {step === 'month' ? (
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, idx) => {
            const isSelected =
              value instanceof Date &&
              value.getFullYear() === activeYear &&
              value.getMonth() === idx;
            const isCurrentMonth = activeYear === thisYear && idx === thisMonth;
            return (
              <Button
                key={month}
                variant={isSelected ? 'primary' : 'ghost'}
                size="sm"
                className={cn(
                  'h-9 text-xs rounded-md w-full',
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold hover:bg-primary'
                    : isCurrentMonth
                      ? 'border border-primary text-primary font-semibold hover:bg-accent'
                      : 'text-[var(--color-foreground)] hover:bg-accent hover:text-accent-foreground'
                )}
                onClick={() => handleMonthSelect(idx)}
              >
                {month}
              </Button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {years.map((yr) => {
            const isSelected =
              value instanceof Date &&
              value.getFullYear() === yr &&
              value.getMonth() === selectedMonth;
            const isCurrentYear = yr === thisYear;
            return (
              <Button
                key={yr}
                variant={isSelected ? 'primary' : 'ghost'}
                size="sm"
                className={cn(
                  'h-9 text-xs rounded-md w-full',
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold hover:bg-primary'
                    : isCurrentYear
                      ? 'border border-primary text-primary font-semibold hover:bg-accent'
                      : 'text-[var(--color-foreground)] hover:bg-accent hover:text-accent-foreground'
                )}
                onClick={() => handleYearSelect(yr)}
              >
                {yr}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function YearPicker({ value, onChange }: { value?: Date; onChange: (date: Date) => void }) {
  const { close } = useDropdown();
  const thisYear = React.useMemo(() => new Date().getFullYear(), []);
  const [startYearPage, setStartYearPage] = React.useState(() => {
    const yr = value instanceof Date ? value.getFullYear() : thisYear;
    return yr - (yr % 12);
  });

  React.useEffect(() => {
    if (value instanceof Date) {
      const yr = value.getFullYear();
      setStartYearPage(yr - (yr % 12));
    } else {
      const yr = new Date().getFullYear();
      setStartYearPage(yr - (yr % 12));
    }
  }, [value]);

  const years = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => startYearPage + i);
  }, [startYearPage]);

  const handleYearSelect = (selectedYear: number) => {
    const selectedDate = new Date(selectedYear, 0, 1);
    onChange(selectedDate);
    close();
  };

  return (
    <div className="p-1.5 w-[240px]">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setStartYearPage((prev) => prev - 12)}
          className="hover:bg-accent text-primary shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold select-none text-[var(--color-foreground)]">
          {startYearPage} - {startYearPage + 11}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setStartYearPage((prev) => prev + 12)}
          className="hover:bg-accent text-primary shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {years.map((yr) => {
          const isSelected = value instanceof Date && value.getFullYear() === yr;
          const isCurrentYear = yr === thisYear;
          return (
            <Button
              key={yr}
              variant={isSelected ? 'primary' : 'ghost'}
              size="sm"
              className={cn(
                'h-9 text-xs rounded-md w-full',
                isSelected
                  ? 'bg-primary text-primary-foreground font-semibold hover:bg-primary'
                  : isCurrentYear
                    ? 'border border-primary text-primary font-semibold hover:bg-accent'
                    : 'text-[var(--color-foreground)] hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={() => handleYearSelect(yr)}
            >
              {yr}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// Helper component that consumes Dropdown context to auto-close single mode picker
function DatePickerCalendar({
  mode,
  value,
  onChange,
  captionLayout,
  startMonth,
  endMonth,
  disabledDates,
  numberOfMonths,
}: {
  mode: 'single' | 'range';
  value: any;
  onChange: any;
  captionLayout?: 'label' | 'dropdown';
  startMonth?: Date;
  endMonth?: Date;
  disabledDates?: (date: Date) => boolean;
  numberOfMonths?: number;
}) {
  const { close } = useDropdown();

  const initialMonth = React.useMemo(() => {
    if (mode === 'single' && value instanceof Date) {
      return value;
    } else if (mode === 'range' && value?.from instanceof Date) {
      return value.from;
    }
    return new Date();
  }, [value, mode]);

  const [month, setMonth] = React.useState<Date>(initialMonth);

  // Sync visible month when selected value changes (e.g. from manual keyboard entry)
  React.useEffect(() => {
    if (mode === 'single' && value instanceof Date) {
      setMonth(value);
    } else if (mode === 'range' && value?.from instanceof Date) {
      setMonth(value.from);
    }
  }, [value, mode]);

  const handleSelect = (val: any) => {
    if (onChange) {
      onChange(val);
    }
    if (mode === 'single') {
      close();
    }
  };

  return mode === 'single' ? (
    <Calendar
      mode="single"
      selected={value as Date}
      onSelect={handleSelect}
      month={month}
      onMonthChange={setMonth}
      captionLayout={captionLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      disabled={disabledDates}
    />
  ) : (
    <Calendar
      mode="range"
      selected={value as DateRange}
      onSelect={handleSelect}
      month={month}
      onMonthChange={setMonth}
      numberOfMonths={numberOfMonths ?? 2}
      captionLayout={captionLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      disabled={disabledDates}
      showOutsideDays={false}
    />
  );
}

export function DatePicker({
  mode = 'single',
  label,
  description,
  hint,
  error,
  required,
  disabled,
  placeholder,
  value,
  onChange,
  size = 'md',
  rounded = 'md',
  numberOfMonths,
  captionLayout = 'label',
  startMonth,
  endMonth,
  disabledDates,
  interactionMode = 'both',
  align = 'start',
  className,
  style,
}: DatePickerProps) {
  const getInputValue = () => {
    if (!value) return '';

    if (mode === 'range') {
      const range = value as DateRange;
      if (!range.from) return '';
      if (!range.to) return format(range.from, 'MM/dd/yyyy');
      return `${format(range.from, 'MM/dd/yyyy')} - ${format(range.to, 'MM/dd/yyyy')}`;
    }

    if (mode === 'month') {
      return format(value as Date, 'MM/yyyy');
    }

    if (mode === 'year') {
      return format(value as Date, 'yyyy');
    }

    return format(value as Date, 'MM/dd/yyyy');
  };

  const isPickMode = interactionMode === 'pick';
  const isWriteMode = interactionMode === 'write';
  const isBothMode = interactionMode === 'both';

  const [typedValue, setTypedValue] = React.useState('');

  // Sync typedValue when external value changes
  React.useEffect(() => {
    setTypedValue(getInputValue());
  }, [value, mode]);

  const hasValue = mode === 'range' ? !!(value as DateRange)?.from : !!value;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let text = e.target.value;
    const isDeleting = text.length < typedValue.length;

    if (mode === 'range') {
      let digits = text.replace(/\D/g, '');
      if (isDeleting) {
        const prevDigits = typedValue.replace(/\D/g, '');
        if (prevDigits === digits && digits.length > 0) {
          digits = digits.substring(0, digits.length - 1);
        }
      }
      digits = digits.substring(0, 16);

      let formatted = '';
      if (digits.length > 0) {
        formatted += digits.substring(0, 2);
        if (digits.length > 2) {
          formatted += '/' + digits.substring(2, 4);
          if (digits.length > 4) {
            formatted += '/' + digits.substring(4, 8);
            if (digits.length > 8) {
              formatted += ' - ' + digits.substring(8, 10);
              if (digits.length > 10) {
                formatted += '/' + digits.substring(10, 12);
                if (digits.length > 12) {
                  formatted += '/' + digits.substring(12, 16);
                }
              }
            }
          }
        }
      }
      text = formatted;
    } else if (mode === 'month') {
      let digits = text.replace(/\D/g, '');
      if (isDeleting) {
        const prevDigits = typedValue.replace(/\D/g, '');
        if (prevDigits === digits && digits.length > 0) {
          digits = digits.substring(0, digits.length - 1);
        }
      }
      digits = digits.substring(0, 6);

      let formatted = '';
      if (digits.length > 0) {
        formatted += digits.substring(0, 2);
        if (digits.length > 2) {
          formatted += '/' + digits.substring(2, 6);
        }
      }
      text = formatted;
    } else if (mode === 'year') {
      let digits = text.replace(/\D/g, '');
      if (isDeleting) {
        const prevDigits = typedValue.replace(/\D/g, '');
        if (prevDigits === digits && digits.length > 0) {
          digits = digits.substring(0, digits.length - 1);
        }
      }
      digits = digits.substring(0, 4);
      text = digits;
    } else {
      let digits = text.replace(/\D/g, '');
      if (isDeleting) {
        const prevDigits = typedValue.replace(/\D/g, '');
        if (prevDigits === digits && digits.length > 0) {
          digits = digits.substring(0, digits.length - 1);
        }
      }
      digits = digits.substring(0, 8);

      let formatted = '';
      if (digits.length > 0) {
        formatted += digits.substring(0, 2);
        if (digits.length > 2) {
          formatted += '/' + digits.substring(2, 4);
          if (digits.length > 4) {
            formatted += '/' + digits.substring(4, 8);
          }
        }
      }
      text = formatted;
    }

    setTypedValue(text);

    if (mode === 'range') {
      const parsedRange = parseRangeString(text);
      if (parsedRange && onChange) {
        onChange(parsedRange);
      }
    } else if (mode === 'month') {
      const parsedMonth = parseMonthString(text);
      if (parsedMonth && onChange) {
        onChange(parsedMonth);
      }
    } else if (mode === 'year') {
      const parsedYear = parseYearString(text);
      if (parsedYear && onChange) {
        onChange(parsedYear);
      }
    } else {
      const parsedDate = parseDateString(text);
      if (parsedDate && onChange) {
        onChange(parsedDate);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x') &&
      (e.metaKey || e.ctrlKey)
    ) {
      return;
    }

    const controlKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Enter',
      'Escape',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ];
    if (controlKeys.includes(e.key)) {
      return;
    }

    const isDigit = /^[0-9]$/.test(e.key);
    const isSeparator = e.key === '/' || e.key === '-' || e.key === ' ';
    if (!isDigit && !isSeparator) {
      e.preventDefault();
    }
  };

  const handleBlur = () => {
    setTypedValue(getInputValue());
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTypedValue('');
    if (onChange) {
      onChange(undefined);
    }
  };

  const inputMaxLength = React.useMemo(() => {
    if (mode === 'range') return 23;
    if (mode === 'month') return 7;
    if (mode === 'year') return 4;
    return 10;
  }, [mode]);

  const inputPlaceholder = React.useMemo(() => {
    if (placeholder) return placeholder;
    if (mode === 'range') return 'MM/DD/YYYY - MM/DD/YYYY';
    if (mode === 'month') return 'MM/YYYY';
    if (mode === 'year') return 'YYYY';
    return 'MM/DD/YYYY';
  }, [placeholder, mode]);

  const inputEl = (
    <Input
      label={label}
      description={description}
      hint={hint}
      error={error}
      required={required}
      disabled={disabled}
      placeholder={inputPlaceholder}
      readOnly={isPickMode}
      value={typedValue}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      maxLength={inputMaxLength}
      onBlur={handleBlur}
      onClick={(e) => {
        // Prevent opening popover if we click the text field in 'both' or 'write' mode
        if (!isPickMode) {
          e.stopPropagation();
        }
      }}
      size={size}
      rounded={rounded}
      leftIcon={
        isBothMode ? (
          <div className="pointer-events-auto cursor-pointer p-0.5 hover:bg-muted rounded transition-colors text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
            <CalendarIcon className="h-4 w-4" />
          </div>
        ) : (
          <CalendarIcon className="h-4 w-4 text-[var(--color-muted-foreground)]" />
        )
      }
      rightIcon={
        <div
          className={cn(
            'transition-opacity duration-150 flex items-center justify-center',
            !hasValue || disabled ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
        >
          <Button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={handleClear}
            rounded="full"
            size="icon-xxs"
            variant="ghost"
            className="hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 pointer-events-auto"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      }
      className={isPickMode ? 'pointer-events-none cursor-pointer' : ''}
    />
  );

  if (isWriteMode) {
    return (
      <div className={cn('w-full max-w-sm', className)} style={style}>
        {inputEl}
      </div>
    );
  }

  return (
    <Dropdown className={cn('w-full max-w-sm', className)} style={style}>
      {/* Trigger: cloneElement-injects onClick onto the wrapper div */}
      <Trigger>
        <div className={disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'}>
          {inputEl}
        </div>
      </Trigger>

      {/* Menu: renders via portal with smart viewport-aware positioning */}
      <Menu align={align} side="auto" sideOffset={6} className="p-1.5 w-auto">
        {mode === 'month' ? (
          <MonthPicker value={value as Date} onChange={onChange || (() => {})} />
        ) : mode === 'year' ? (
          <YearPicker value={value as Date} onChange={onChange || (() => {})} />
        ) : (
          <DatePickerCalendar
            mode={mode as 'single' | 'range'}
            value={value}
            onChange={onChange}
            captionLayout={captionLayout}
            startMonth={startMonth}
            endMonth={endMonth}
            disabledDates={disabledDates}
            numberOfMonths={numberOfMonths}
          />
        )}
      </Menu>
    </Dropdown>
  );
}

export default DatePicker;
