'use client';

import * as React from 'react';
import { type DayButton, DayPicker, getDefaultClassNames, type Locale } from 'react-day-picker';

import { cn } from '@/design-system/utils/utils';
import { buttonVariants } from '../Button/button.variants';
import { type VariantProps } from 'class-variance-authority';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Select } from '../Select';

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: VariantProps<typeof buttonVariants>['variant'];
}) {
  const defaultClassNames = getDefaultClassNames();

  // Extract startMonth and endMonth to compute default fallback if startMonth is present but endMonth is missing
  const { startMonth, endMonth: endMonthProp, ...restProps } = props;
  const resolvedEndMonth = endMonthProp || (startMonth ? new Date() : undefined);

  return (
    <DayPicker
      startMonth={startMonth}
      endMonth={resolvedEndMonth}
      showOutsideDays={showOutsideDays}
      className={cn(
        'group/calendar bg-background p-1.5 [--cell-radius:var(--radius-md)] [--cell-size:1.625rem] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString(locale?.code, { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('relative flex flex-col gap-4 md:flex-row', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant as any }),
          'h-7 w-7 p-0 select-none aria-disabled:opacity-50',
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant as any }),
          'h-7 w-7 p-0 select-none aria-disabled:opacity-50',
          defaultClassNames.button_next
        ),
        month_caption: cn(
          'flex h-7 w-full items-center justify-center px-7',
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          'flex h-7 w-full items-center justify-center gap-2 text-xs font-medium',
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          'relative inline-flex items-center rounded-md px-1.5 py-0.5 cursor-pointer',
          'hover:bg-accent hover:text-accent-foreground transition-colors',
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          'absolute inset-0 opacity-0 cursor-pointer w-full',
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          'font-medium select-none pointer-events-none',
          captionLayout === 'label'
            ? 'text-xs'
            : 'flex items-center gap-1 text-xs [&>svg]:size-2.5 [&>svg]:text-muted-foreground',
          defaultClassNames.caption_label
        ),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'flex-1 rounded-(--cell-radius) text-[0.68rem] font-normal text-muted-foreground select-none',
          defaultClassNames.weekday
        ),
        week: cn('mt-1 flex w-full', defaultClassNames.week),
        week_number_header: cn('w-7 select-none', defaultClassNames.week_number_header),
        week_number: cn(
          'text-[0.68rem] text-muted-foreground select-none',
          defaultClassNames.week_number
        ),
        day: cn(
          'group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)',
          props.showWeekNumber
            ? '[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)'
            : '[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)',
          defaultClassNames.day
        ),
        range_start: cn(
          'relative isolate z-0 rounded-l-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted',
          defaultClassNames.range_start
        ),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn(
          'relative isolate z-0 rounded-r-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted',
          defaultClassNames.range_end
        ),
        today: cn(
          'rounded-(--cell-radius) text-foreground data-[selected=true]:rounded-none',
          defaultClassNames.today
        ),
        outside: cn(
          'text-muted-foreground aria-selected:text-muted-foreground',
          defaultClassNames.outside
        ),
        disabled: cn('text-muted-foreground opacity-50', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => {
          return (
            <div data-slot="calendar" ref={rootRef} className={cn(rootClassName)} {...rootProps} />
          );
        },
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          if (orientation === 'left') {
            return <ChevronLeftIcon className={cn('size-4', chevronClassName)} {...chevronProps} />;
          }

          if (orientation === 'right') {
            return (
              <ChevronRightIcon className={cn('size-4', chevronClassName)} {...chevronProps} />
            );
          }

          return <ChevronDownIcon className={cn('size-4', chevronClassName)} {...chevronProps} />;
        },
        DayButton: ({ ...dayButtonProps }) => (
          <CalendarDayButton locale={locale} {...dayButtonProps} />
        ),
        Dropdown: ({ value, onChange, options }) => {
          const isYearDropdown =
            options && options.every((opt) => !isNaN(Number(opt.value)) && Number(opt.value) > 100);
          let selectOptions = (options ?? []).map((opt) => ({
            value: String(opt.value),
            label: opt.label,
            disabled: opt.disabled,
          }));
          if (isYearDropdown) {
            selectOptions = [...selectOptions].sort((a, b) => Number(b.value) - Number(a.value));
          }
          return (
            <Select
              options={selectOptions}
              value={String(value)}
              onValueChange={(val) => {
                // Simulate a native select change event
                const syntheticEvent = {
                  target: { value: val },
                } as React.ChangeEvent<HTMLSelectElement>;
                onChange?.(syntheticEvent);
              }}
              size="xs"
              displayMode="compact"
              align="start"
              rounded="sm"
              className="w-[64px] px-1 [&_svg]:hidden"
              width={100}
              showArrow={false}
            />
          );
        },
        WeekNumber: ({ children, ...weekNumberProps }) => {
          return (
            <td {...weekNumberProps}>
              <div className="flex size-7 items-center justify-center text-center">{children}</div>
            </td>
          );
        },
        ...components,
      }}
      {...restProps}
    />
  );
}

export function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button
      ref={ref}
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-selected={modifiers.selected}
      data-today={modifiers.today}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        // Base shape & layout — compact cells
        'relative z-10 inline-flex w-full min-w-[1.625rem] aspect-square items-center justify-center',
        'rounded-[var(--cell-radius)] border-0 text-xs font-normal leading-none',
        'cursor-pointer select-none outline-none ring-0',
        // Smooth transitions for color + press-bounce
        'transition-all duration-100 ease-out',
        'active:scale-90 active:duration-75',
        // Default (unselected) hover
        'hover:bg-accent hover:text-accent-foreground',
        // Today styling
        modifiers.today &&
          !modifiers.selected &&
          'border border-primary text-primary font-semibold',
        modifiers.today && modifiers.selected && 'font-semibold border-0',
        // Single selected — primary bg, no ring
        'data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:hover:bg-primary data-[selected-single=true]:border-0',
        // Range start
        'data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-start=true]:rounded-l-[var(--cell-radius)] data-[range-start=true]:rounded-r-none data-[range-start=true]:hover:bg-primary data-[range-start=true]:border-0',
        // Range end
        'data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-end=true]:rounded-r-[var(--cell-radius)] data-[range-end=true]:rounded-l-none data-[range-end=true]:hover:bg-primary data-[range-end=true]:border-0',
        // Range middle — no radius
        'data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-middle=true]:hover:bg-accent',
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

export default Calendar;
