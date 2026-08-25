'use client';

import * as React from 'react';
import ReactDOM from 'react-dom';
import { cn } from '@/design-system/utils/utils';
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react';
import type {
  MultiSelectDisplayMode,
  SelectContentProps,
  SelectOption,
  SelectOptionProps,
  SelectProps,
  SelectTriggerProps,
} from './select.types';
import { roundnessMap, selectTriggerVariants } from './select.variants';
import { useSelect } from './useSelect';
import { Button } from '../Button';
import { MultiValueRenderer } from './MultiValueRenderer';
import { CompactMultiValueRenderer } from './CompactMultiValueRenderer';
import './select.css';

export type {
  SelectOption,
  SelectProps,
  SelectTriggerProps,
  SelectContentProps,
  SelectOptionProps,
};

interface SelectContextValue {
  isOpen: boolean;
  setIsOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  selectedValues: any[];
  handleSelectOption: (val: any) => void;
  multiple: boolean;
  searchable: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  focusedIndex: number;
  setFocusedIndex: (val: number) => void;
  filteredOptions: SelectOption<any>[];
  setRegisteredOptions: React.Dispatch<React.SetStateAction<SelectOption<any>[]>>;

  // DOM Refs
  containerRef: React.RefObject<HTMLDivElement | null>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  listRef: React.RefObject<HTMLDivElement | null>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;

  // Other flat UI state
  size: 'xs' | 'sm' | 'md' | 'lg';
  rounded: 'none' | 'sm' | 'md' | 'lg' | 'full';
  error?: string;
  placeholder?: string;
  displayMode: MultiSelectDisplayMode;
  maxVisibleTags: number | 'auto';
  autoMaxTags: number;
  clearable: boolean;
  disabled: boolean;
  loading: boolean;
  handleClear: (e: React.MouseEvent) => void;
  handleRemoveItem: (e: React.MouseEvent, val: any) => void;
  setIsHoveredClear: (val: boolean) => void;
  setHoveredTagIndex: (val: number | null) => void;
  selectedOptions: SelectOption<any>[];
  handleKeyDown: (e: React.KeyboardEvent) => void;

  // Measurement layout
  tagsContainerRef: React.RefObject<HTMLDivElement | null>;
  measurementRef: React.RefObject<HTMLDivElement | null>;

  // Position
  dropdownStyle: React.CSSProperties;
  resolvedDirection: string;
  searchPlaceholder?: string;
  name?: string;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  sideOffset?: number;
  alignOffset?: number;
  side?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  align?: 'start' | 'center' | 'end';
  width?: number | string | 'trigger';
  showArrow: boolean;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

const useSelectContext = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('Select subcomponents must be used inside a <Select /> wrapper.');
  }
  return context;
};

interface DefaultOptionRendererProps {
  icon?: React.ReactNode;
  label?: string;
  description?: React.ReactNode;
  isSelected?: boolean;
}

export function DefaultOptionRenderer({
  icon,
  label,
  description,
  isSelected,
}: DefaultOptionRendererProps) {
  return (
    <div
      className={cn('flex flex-1 min-w-0 gap-2.5', description ? 'items-start' : 'items-center')}
    >
      {icon && (
        <span
          className={cn(
            'shrink-0 flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4',
            description && 'mt-0.5'
          )}
        >
          {icon}
        </span>
      )}
      <div className="flex flex-col min-w-0 text-left">
        <span className="truncate text-xs font-medium">{label}</span>
        {description && (
          <span
            className={cn(
              'text-[11px] leading-normal truncate mt-0.5',
              isSelected ? 'text-[var(--color-primary)]/80' : 'text-[var(--color-muted-foreground)]'
            )}
          >
            {description}
          </span>
        )}
      </div>
    </div>
  );
}

function SelectInner<T = string>(
  {
    options = [],
    value,
    defaultValue,
    onValueChange,
    multiple = false,
    displayMode = 'wrap',
    maxVisibleTags = 2,
    searchable = false,
    clearable = false,
    disabled = false,
    loading = false,
    label,
    description,
    error,
    placeholder = 'Select options...',
    size = 'md',
    rounded = 'md',
    searchPlaceholder = 'Search...',
    renderOption,
    className,
    style,
    name,
    onBlur,
    required,
    align = 'end',
    side = 'auto',
    sideOffset = 6,
    alignOffset = 0,
    width = 'trigger',
    showArrow = true,
    children,
    ...props
  }: SelectProps<T>,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const [registeredOptions, setRegisteredOptions] = React.useState<SelectOption<any>[]>([]);
  const finalOptions =
    options && options.length > 0 ? options : (registeredOptions as SelectOption<T>[]);

  const {
    isOpen,
    setIsOpen,
    searchQuery,
    setSearchQuery,
    focusedIndex,
    setFocusedIndex,
    setIsHoveredClear,
    setHoveredTagIndex,
    selectedValues,
    filteredOptions,
    handleSelectOption,
    handleClear,
    handleRemoveItem,
    handleKeyDown,
    selectedOptions,
    containerRef,
    triggerRef,
    searchInputRef,
    listRef,
    dropdownRef,
  } = useSelect<T>({
    options: finalOptions,
    value,
    defaultValue,
    onValueChange,
    multiple,
    searchable,
    disabled,
    loading,
  });

  // Portal positioning state. Starts fixed + hidden: the closed dropdown stays
  // mounted in document.body, and a static position would make it occupy real
  // layout space below the app, stretching the page. Opening replaces this
  // with the computed fixed position.
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({
    position: 'fixed',
    top: 0,
    left: 0,
    visibility: 'hidden',
    zIndex: 9999,
  });
  const [resolvedDirection, setResolvedDirection] = React.useState<
    'top' | 'bottom' | 'left' | 'right'
  >('bottom');

  const updateDropdownPosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const dropdownHeight = 280;

    let dropdownWidth = rect.width;
    if (width === 'trigger') {
      dropdownWidth = rect.width;
    } else if (typeof width === 'number') {
      dropdownWidth = width;
    } else if (typeof width === 'string') {
      const parsed = parseFloat(width);
      if (!isNaN(parsed)) {
        dropdownWidth = parsed;
      }
    }

    let resolvedSide: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
    if (side === 'auto') {
      resolvedSide = spaceBelow < dropdownHeight && rect.top > dropdownHeight ? 'top' : 'bottom';
    } else {
      resolvedSide = side;
    }
    setResolvedDirection(resolvedSide);

    let topVal: number | string = 'auto';
    let bottomVal: number | string = 'auto';
    let leftVal: number | string = 'auto';

    if (resolvedSide === 'top') {
      leftVal = rect.left + alignOffset;
      if (align === 'end') {
        leftVal = rect.right - dropdownWidth - alignOffset;
      } else if (align === 'center') {
        leftVal = rect.left + rect.width / 2 - dropdownWidth / 2 + alignOffset;
      }
      bottomVal = viewportHeight - rect.top + sideOffset;
    } else if (resolvedSide === 'bottom') {
      leftVal = rect.left + alignOffset;
      if (align === 'end') {
        leftVal = rect.right - dropdownWidth - alignOffset;
      } else if (align === 'center') {
        leftVal = rect.left + rect.width / 2 - dropdownWidth / 2 + alignOffset;
      }
      topVal = rect.bottom + sideOffset;
    } else if (resolvedSide === 'left') {
      leftVal = rect.left - dropdownWidth - sideOffset;
      topVal = rect.top + alignOffset;
      if (align === 'end') {
        bottomVal = viewportHeight - rect.bottom + alignOffset;
        topVal = 'auto';
      } else if (align === 'center') {
        topVal = rect.top + rect.height / 2 - dropdownHeight / 2 + alignOffset;
      }
    } else if (resolvedSide === 'right') {
      leftVal = rect.right + sideOffset;
      topVal = rect.top + alignOffset;
      if (align === 'end') {
        bottomVal = viewportHeight - rect.bottom + alignOffset;
        topVal = 'auto';
      } else if (align === 'center') {
        topVal = rect.top + rect.height / 2 - dropdownHeight / 2 + alignOffset;
      }
    }

    const finalStyle: React.CSSProperties = {
      position: 'fixed',
      left: leftVal,
      top: topVal,
      bottom: bottomVal,
      zIndex: 9999,
    };

    if (width === 'trigger') {
      finalStyle.width = rect.width;
    } else if (typeof width === 'number') {
      finalStyle.width = width;
    } else if (typeof width === 'string') {
      finalStyle.width = width;
    }

    setDropdownStyle(finalStyle);
  }, [triggerRef, align, side, sideOffset, alignOffset, width]);

  React.useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();

    const timer = setTimeout(updateDropdownPosition, 10);

    const handleReposition = () => updateDropdownPosition();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, selectedValues, updateDropdownPosition]);

  // Auto maxVisibleTags refs
  const tagsContainerRef = React.useRef<HTMLDivElement>(null);
  const measurementRef = React.useRef<HTMLDivElement>(null);
  const [autoMaxTags, setAutoMaxTags] = React.useState<number>(1);

  React.useLayoutEffect(() => {
    if (displayMode !== 'compact' || maxVisibleTags !== 'auto') return;

    const updateMaxTags = () => {
      const container = tagsContainerRef.current;
      const measurement = measurementRef.current;
      if (!container || !measurement) return;

      const containerWidth = container.getBoundingClientRect().width;
      const children = Array.from(measurement.children) as HTMLElement[];
      if (children.length === 0) {
        setAutoMaxTags(0);
        return;
      }

      const plusBadgeWidth = 38;
      const gap = 6;
      let currentWidth = 0;
      let fitCount = 0;

      for (let i = 0; i < children.length; i++) {
        const childWidth = children[i].getBoundingClientRect().width;
        const nextWidth = currentWidth + childWidth + (fitCount > 0 ? gap : 0);
        const isLastTag = i === children.length - 1;
        const requiredWidth = nextWidth + (isLastTag ? 0 : gap + plusBadgeWidth);

        if (requiredWidth <= containerWidth) {
          currentWidth = nextWidth;
          fitCount++;
        } else {
          break;
        }
      }

      setAutoMaxTags(Math.max(1, fitCount));
    };

    updateMaxTags();

    const container = tagsContainerRef.current;
    if (container) {
      const observer = new ResizeObserver(updateMaxTags);
      observer.observe(container);
      return () => observer.disconnect();
    }
  }, [selectedValues, displayMode, maxVisibleTags]);

  React.useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);

  let originClass = 'origin-top';
  let closedTransformClass = 'opacity-0 -translate-y-1.5 scale-[0.97]';

  if (resolvedDirection === 'top') {
    originClass = 'origin-bottom';
    closedTransformClass = 'opacity-0 translate-y-1.5 scale-[0.97]';
  } else if (resolvedDirection === 'bottom') {
    originClass = 'origin-top';
    closedTransformClass = 'opacity-0 -translate-y-1.5 scale-[0.97]';
  } else if (resolvedDirection === 'left') {
    originClass = 'origin-right';
    closedTransformClass = 'opacity-0 translate-x-1.5 scale-[0.97]';
  } else if (resolvedDirection === 'right') {
    originClass = 'origin-left';
    closedTransformClass = 'opacity-0 -translate-x-1.5 scale-[0.97]';
  }

  const dropdownEl = (
    <div
      ref={dropdownRef}
      className={cn(
        'shadow-xl border overflow-hidden select-dropdown-transition transform bg-[var(--color-popover)] border-[var(--color-border)]',
        originClass,
        isOpen
          ? 'opacity-100 translate-y-0 translate-x-0 scale-100 pointer-events-auto'
          : `${closedTransformClass} pointer-events-none`,
        roundnessMap[rounded]
      )}
      style={dropdownStyle}
    >
      {searchable && (
        <div className="relative flex items-center px-3.5 py-3 border-b border-[var(--color-border)]">
          <Search size={16} className="mr-2 shrink-0 text-[var(--color-muted-foreground)]" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent border-0 text-sm focus:outline-none focus:ring-0 focus-visible:ring-0 p-0 pr-7 shadow-none outline-none text-[var(--color-foreground)]"
          />
          {searchQuery && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => setSearchQuery('')}
                rounded="full"
                size="icon-xxs"
                variant="ghost"
                className="hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
              >
                <X size={13} />
              </Button>
            </div>
          )}
        </div>
      )}

      <div ref={listRef} className="max-h-60 overflow-y-auto p-1 space-y-0.5">
        {filteredOptions.length === 0 ? (
          <div className="text-xs text-center py-6 select-none text-[var(--color-muted-foreground)]">
            No options found.
          </div>
        ) : (
          filteredOptions.map((opt, index) => {
            const isSelected = selectedValues.includes(opt.value);
            const isFocused = index === focusedIndex;

            return (
              <div
                key={opt.value as string}
                onClick={() => {
                  if (!opt.disabled) handleSelectOption(opt.value);
                }}
                onMouseEnter={() => setFocusedIndex(index)}
                className={cn(
                  'relative flex items-center justify-between pl-5 pr-3 py-2 text-xs font-medium cursor-pointer rounded transition-all duration-75 active:scale-[0.98] select-none',
                  opt.disabled && 'opacity-90 cursor-default pointer-events-none',
                  isSelected
                    ? 'bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[var(--color-primary)] font-semibold'
                    : isFocused
                      ? 'bg-[var(--color-accent)] text-[var(--color-foreground)]'
                      : 'text-[var(--color-foreground)]'
                )}
              >
                {isSelected && (
                  <span className="absolute left-1.5 top-2 bottom-2 w-[3px] rounded-full bg-[var(--color-primary)] animate-in fade-in slide-in-from-left-1 duration-200" />
                )}
                {opt.content ? (
                  opt.content
                ) : (
                  <DefaultOptionRenderer
                    icon={opt.icon}
                    label={opt.label}
                    description={opt.description}
                    isSelected={isSelected}
                  />
                )}
                {isSelected && (
                  <Check
                    size={14}
                    className="shrink-0 ml-2 animate-in fade-in zoom-in-75 duration-200"
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const contextValue: SelectContextValue = {
    isOpen,
    setIsOpen,
    searchQuery,
    setSearchQuery,
    focusedIndex,
    setFocusedIndex,
    selectedValues,
    filteredOptions,
    handleSelectOption,
    handleClear,
    handleRemoveItem,
    handleKeyDown,
    selectedOptions,
    containerRef,
    triggerRef,
    searchInputRef,
    listRef,
    dropdownRef,
    multiple,
    searchable,
    setRegisteredOptions,
    size,
    rounded,
    error,
    placeholder,
    displayMode,
    maxVisibleTags,
    autoMaxTags,
    clearable,
    disabled,
    loading,
    setIsHoveredClear,
    setHoveredTagIndex,
    tagsContainerRef,
    measurementRef,
    dropdownStyle,
    resolvedDirection,
    searchPlaceholder,
    name,
    onBlur,
    sideOffset,
    alignOffset,
    side,
    align,
    width,
    showArrow,
  };

  const isCompound = React.Children.count(children) > 0;

  if (isCompound) {
    return (
      <SelectContext.Provider value={contextValue}>
        <div
          ref={containerRef}
          className={cn('flex flex-col gap-1.5 w-full', className)}
          style={style}
          {...(props as any)}
        >
          {label && (
            <label
              className={cn(
                'text-sm font-medium flex items-center gap-0.5 select-none',
                error ? 'text-[var(--color-danger)]' : 'text-[var(--color-foreground)]'
              )}
            >
              {label}
              {required && <span className="text-[var(--color-danger)]">*</span>}
            </label>
          )}
          <div className="relative w-full">{children}</div>
          {(error || description) && (
            <div className="pointer-events-none flex flex-col gap-1">
              {error && <p className="text-xs font-medium text-[var(--color-danger)]">{error}</p>}
              {description && !error && (
                <p className="text-xs leading-normal text-[var(--color-muted-foreground)]">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
      </SelectContext.Provider>
    );
  }

  return (
    <SelectContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn('flex flex-col gap-1.5 w-full', className)}
        style={style}
      >
        {label && (
          <label
            className={cn(
              'text-sm font-medium flex items-center gap-0.5 select-none',
              error ? 'text-[var(--color-danger)]' : 'text-[var(--color-foreground)]'
            )}
          >
            {label}
            {required && <span className="text-[var(--color-danger)]">*</span>}
          </label>
        )}

        <div className="relative w-full">
          <button
            ref={triggerRef}
            type="button"
            name={name}
            disabled={disabled || loading}
            onClick={() => setIsOpen((prev) => !prev)}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
            className={cn(
              selectTriggerVariants({ size, rounded, hasError: !!error }),
              displayMode === 'compact' && {
                'h-7 py-0 min-h-0': size === 'xs',
                'h-8 py-0 min-h-0': size === 'sm',
                'h-[38px] py-0 min-h-0': size === 'md',
                'h-11 py-0 min-h-0': size === 'lg',
              }
            )}
            {...props}
          >
            <div
              ref={tagsContainerRef}
              className={cn(
                'items-center flex-1 mr-2 min-w-0 overflow-hidden',
                displayMode === 'compact' ? 'flex flex-nowrap gap-1.5' : 'flex flex-wrap gap-1.5'
              )}
            >
              {selectedOptions.length === 0 ? (
                <span className="text-[var(--color-muted-foreground)] truncate whitespace-nowrap">
                  {placeholder}
                </span>
              ) : multiple ? (
                displayMode === 'compact' ? (
                  <CompactMultiValueRenderer
                    selectedOptions={selectedOptions}
                    disabled={disabled}
                    handleRemoveItem={handleRemoveItem}
                    setHoveredTagIndex={setHoveredTagIndex}
                    maxVisibleTags={
                      typeof maxVisibleTags === 'number' ? maxVisibleTags : autoMaxTags
                    }
                  />
                ) : (
                  <MultiValueRenderer
                    selectedOptions={selectedOptions}
                    disabled={disabled}
                    handleRemoveItem={handleRemoveItem}
                    setHoveredTagIndex={setHoveredTagIndex}
                  />
                )
              ) : (
                <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                  {selectedOptions[0].icon && (
                    <span className="shrink-0">{selectedOptions[0].icon}</span>
                  )}
                  <span className="truncate min-w-0">
                    {selectedOptions[0].label?.includes(' > ')
                      ? selectedOptions[0].label.split(' > ').pop()
                      : selectedOptions[0].label}
                  </span>
                </div>
              )}
            </div>

            {/* Hidden measurement container for auto maxVisibleTags calculation */}
            {multiple && displayMode === 'compact' && maxVisibleTags === 'auto' && (
              <div
                ref={measurementRef}
                className="absolute top-0 left-0 flex flex-nowrap gap-1.5 opacity-0 pointer-events-none select-none invisible"
                style={{ width: '100%' }}
              >
                {selectedOptions.map((opt) => (
                  <span
                    key={opt.value as string}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border shrink-0"
                  >
                    {opt.icon && <span className="mr-0.5 shrink-0">{opt.icon}</span>}
                    <span>{opt.label}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5 shrink-0 text-[var(--color-muted-foreground)]">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {clearable && selectedValues.length > 0 && !disabled && (
                <Button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={handleClear}
                  onMouseEnter={() => setIsHoveredClear(true)}
                  onMouseLeave={() => setIsHoveredClear(false)}
                  rounded="full"
                  size="icon-xxs"
                  variant="ghost"
                  className="hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 pointer-events-auto"
                >
                  <X size={13} />
                </Button>
              )}
              {showArrow && (
                <Button
                  asChild
                  rounded="full"
                  size="icon-xxs"
                  variant="ghost"
                  className="hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 pointer-events-auto"
                >
                  <span className="inline-flex items-center justify-center cursor-pointer">
                    <ChevronDown
                      size={14}
                      className={cn('transition-transform duration-200', isOpen && 'rotate-180')}
                    />
                  </span>
                </Button>
              )}
            </div>
          </button>

          {/* Render dropdown via portal so it escapes overflow:hidden cards */}
          {typeof document !== 'undefined' && ReactDOM.createPortal(dropdownEl, document.body)}
        </div>

        {(error || description) && (
          <div className="pointer-events-none flex flex-col gap-1">
            {error && <p className="text-xs font-medium text-[var(--color-danger)]">{error}</p>}
            {description && !error && (
              <p className="text-xs leading-normal text-[var(--color-muted-foreground)]">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </SelectContext.Provider>
  );
}

export const Trigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ children, className, ...props }, ref) => {
    const context = useSelectContext();
    const {
      triggerRef,
      setIsOpen,
      isOpen,
      disabled,
      loading,
      size,
      rounded,
      error,
      displayMode,
      selectedOptions,
      placeholder,
      clearable,
      selectedValues,
      handleClear,
      setIsHoveredClear,
      setHoveredTagIndex,
      handleRemoveItem,
      multiple,
      maxVisibleTags,
      autoMaxTags,
      tagsContainerRef,
      measurementRef,
      handleKeyDown,
      onBlur,
      name,
      showArrow,
    } = context;

    const setRefs = React.useCallback(
      (node: HTMLButtonElement | null) => {
        (triggerRef as any).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as any).current = node;
        }
      },
      [ref, triggerRef]
    );

    return (
      <button
        ref={setRefs}
        type="button"
        name={name}
        disabled={disabled || loading}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        className={cn(
          selectTriggerVariants({ size, rounded, hasError: !!error }),
          displayMode === 'compact' && {
            'h-7 py-0 min-h-0': size === 'xs',
            'h-8 py-0 min-h-0': size === 'sm',
            'h-[38px] py-0 min-h-0': size === 'md',
            'h-11 py-0 min-h-0': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            <div
              ref={tagsContainerRef as any}
              className={cn(
                'items-center flex-1 mr-2 min-w-0 overflow-hidden text-left',
                displayMode === 'compact' ? 'flex flex-nowrap gap-1.5' : 'flex flex-wrap gap-1.5'
              )}
            >
              {selectedOptions.length === 0 ? (
                <span className="text-[var(--color-muted-foreground)]">{placeholder}</span>
              ) : multiple ? (
                displayMode === 'compact' ? (
                  <CompactMultiValueRenderer
                    selectedOptions={selectedOptions}
                    disabled={disabled}
                    handleRemoveItem={handleRemoveItem}
                    setHoveredTagIndex={setHoveredTagIndex}
                    maxVisibleTags={
                      typeof maxVisibleTags === 'number' ? maxVisibleTags : autoMaxTags
                    }
                  />
                ) : (
                  <MultiValueRenderer
                    selectedOptions={selectedOptions}
                    disabled={disabled}
                    handleRemoveItem={handleRemoveItem}
                    setHoveredTagIndex={setHoveredTagIndex}
                  />
                )
              ) : (
                <div className="flex items-center gap-2 truncate min-w-0 flex-1 text-left">
                  {selectedOptions[0].icon && (
                    <span className="shrink-0">{selectedOptions[0].icon}</span>
                  )}
                  <span className="truncate min-w-0">
                    {selectedOptions[0].label?.includes(' > ')
                      ? selectedOptions[0].label.split(' > ').pop()
                      : selectedOptions[0].label}
                  </span>
                </div>
              )}
            </div>

            {multiple && displayMode === 'compact' && maxVisibleTags === 'auto' && (
              <div
                ref={measurementRef as any}
                className="absolute top-0 left-0 flex flex-nowrap gap-1.5 opacity-0 pointer-events-none select-none invisible"
                style={{ width: '100%' }}
              >
                {selectedOptions.map((opt) => (
                  <span
                    key={opt.value as string}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border shrink-0"
                  >
                    {opt.icon && <span className="mr-0.5 shrink-0">{opt.icon}</span>}
                    <span>{opt.label}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5 shrink-0 text-[var(--color-muted-foreground)]">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {clearable && selectedValues.length > 0 && !disabled && (
                <Button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={handleClear}
                  onMouseEnter={() => setIsHoveredClear(true)}
                  onMouseLeave={() => setIsHoveredClear(false)}
                  rounded="full"
                  size="icon-xxs"
                  variant="ghost"
                  className="hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 pointer-events-auto"
                >
                  <X size={13} />
                </Button>
              )}
              {showArrow && (
                <Button
                  asChild
                  rounded="full"
                  size="icon-xxs"
                  variant="ghost"
                  className="hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 pointer-events-auto"
                >
                  <span className="inline-flex items-center justify-center cursor-pointer">
                    <ChevronDown
                      size={14}
                      className={cn('transition-transform duration-200', isOpen && 'rotate-180')}
                    />
                  </span>
                </Button>
              )}
            </div>
          </>
        )}
      </button>
    );
  }
);
Trigger.displayName = 'SelectTrigger';

export function Menu({
  children,
  className,
  sideOffset,
  alignOffset,
  side,
  align,
  width,
  ...props
}: SelectContentProps) {
  const context = useSelectContext();
  const {
    isOpen,
    rounded,
    searchable,
    searchQuery,
    setSearchQuery,
    searchPlaceholder,
    searchInputRef,
    listRef,
    dropdownRef,
    triggerRef,
    sideOffset: contextSideOffset,
    alignOffset: contextAlignOffset,
    side: contextSide,
    align: contextAlign,
    width: contextWidth,
  } = context;

  const activeSideOffset = sideOffset !== undefined ? sideOffset : (contextSideOffset ?? 6);
  const activeAlignOffset = alignOffset !== undefined ? alignOffset : (contextAlignOffset ?? 0);
  const activeSide = side !== undefined ? side : (contextSide ?? 'auto');
  const activeAlign = align !== undefined ? align : (contextAlign ?? 'end');
  const activeWidth = width !== undefined ? width : (contextWidth ?? 'trigger');

  // Fixed + hidden until positioned — a static portal in document.body would
  // occupy layout space and stretch the page (see dropdownStyle above).
  const [localDropdownStyle, setLocalDropdownStyle] = React.useState<React.CSSProperties>({
    position: 'fixed',
    top: 0,
    left: 0,
    visibility: 'hidden',
    zIndex: 9999,
  });
  const [localResolvedDirection, setLocalResolvedDirection] = React.useState<
    'top' | 'bottom' | 'left' | 'right'
  >('bottom');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updateDropdownPosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const dropdownHeight = 280;

    let dropdownWidth = rect.width;
    if (activeWidth === 'trigger') {
      dropdownWidth = rect.width;
    } else if (typeof activeWidth === 'number') {
      dropdownWidth = activeWidth;
    } else if (typeof activeWidth === 'string') {
      const parsed = parseFloat(activeWidth);
      if (!isNaN(parsed)) {
        dropdownWidth = parsed;
      }
    }

    let resolvedSide: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
    if (activeSide === 'auto') {
      resolvedSide = spaceBelow < dropdownHeight && rect.top > dropdownHeight ? 'top' : 'bottom';
    } else {
      resolvedSide = activeSide;
    }
    setLocalResolvedDirection(resolvedSide);

    let topVal: number | string = 'auto';
    let bottomVal: number | string = 'auto';
    let leftVal: number | string = 'auto';

    if (resolvedSide === 'top') {
      leftVal = rect.left + activeAlignOffset;
      if (activeAlign === 'end') {
        leftVal = rect.right - dropdownWidth - activeAlignOffset;
      } else if (activeAlign === 'center') {
        leftVal = rect.left + rect.width / 2 - dropdownWidth / 2 + activeAlignOffset;
      }
      bottomVal = viewportHeight - rect.top + activeSideOffset;
    } else if (resolvedSide === 'bottom') {
      leftVal = rect.left + activeAlignOffset;
      if (activeAlign === 'end') {
        leftVal = rect.right - dropdownWidth - activeAlignOffset;
      } else if (activeAlign === 'center') {
        leftVal = rect.left + rect.width / 2 - dropdownWidth / 2 + activeAlignOffset;
      }
      topVal = rect.bottom + activeSideOffset;
    } else if (resolvedSide === 'left') {
      leftVal = rect.left - dropdownWidth - activeSideOffset;
      topVal = rect.top + activeAlignOffset;
      if (activeAlign === 'end') {
        bottomVal = viewportHeight - rect.bottom + activeAlignOffset;
        topVal = 'auto';
      } else if (activeAlign === 'center') {
        topVal = rect.top + rect.height / 2 - dropdownHeight / 2 + activeAlignOffset;
      }
    } else if (resolvedSide === 'right') {
      leftVal = rect.right + activeSideOffset;
      topVal = rect.top + activeAlignOffset;
      if (activeAlign === 'end') {
        bottomVal = viewportHeight - rect.bottom + activeAlignOffset;
        topVal = 'auto';
      } else if (activeAlign === 'center') {
        topVal = rect.top + rect.height / 2 - dropdownHeight / 2 + activeAlignOffset;
      }
    }

    const finalStyle: React.CSSProperties = {
      position: 'fixed',
      left: leftVal,
      top: topVal,
      bottom: bottomVal,
      zIndex: 9999,
    };

    if (activeWidth === 'trigger') {
      finalStyle.width = rect.width;
    } else if (typeof activeWidth === 'number') {
      finalStyle.width = activeWidth;
    } else if (typeof activeWidth === 'string') {
      finalStyle.width = activeWidth;
    }

    setLocalDropdownStyle(finalStyle);
  }, [triggerRef, activeAlign, activeSide, activeSideOffset, activeAlignOffset, activeWidth]);

  React.useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();

    const timer = setTimeout(updateDropdownPosition, 10);

    const handleReposition = () => updateDropdownPosition();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, updateDropdownPosition]);

  if (!isOpen || !mounted) return null;

  let originClass = 'origin-top';
  let closedTransformClass = 'opacity-0 -translate-y-1.5 scale-[0.97]';

  if (localResolvedDirection === 'top') {
    originClass = 'origin-bottom';
    closedTransformClass = 'opacity-0 translate-y-1.5 scale-[0.97]';
  } else if (localResolvedDirection === 'bottom') {
    originClass = 'origin-top';
    closedTransformClass = 'opacity-0 -translate-y-1.5 scale-[0.97]';
  } else if (localResolvedDirection === 'left') {
    originClass = 'origin-right';
    closedTransformClass = 'opacity-0 translate-x-1.5 scale-[0.97]';
  } else if (localResolvedDirection === 'right') {
    originClass = 'origin-left';
    closedTransformClass = 'opacity-0 -translate-x-1.5 scale-[0.97]';
  }

  const dropdownEl = (
    <div
      ref={dropdownRef as any}
      className={cn(
        'shadow-xl border overflow-hidden select-dropdown-transition transform bg-[var(--color-popover)] border-[var(--color-border)]',
        originClass,
        isOpen
          ? 'opacity-100 translate-y-0 translate-x-0 scale-100 pointer-events-auto'
          : `${closedTransformClass} pointer-events-none`,
        roundnessMap[rounded],
        className
      )}
      {...props}
      style={{ ...props.style, ...localDropdownStyle }}
    >
      {searchable && (
        <div className="relative flex items-center px-3.5 py-3 border-b border-[var(--color-border)]">
          <Search size={16} className="mr-2 shrink-0 text-[var(--color-muted-foreground)]" />
          <input
            ref={searchInputRef as any}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent border-0 text-sm focus:outline-none focus:ring-0 focus-visible:ring-0 p-0 pr-7 shadow-none outline-none text-[var(--color-foreground)]"
          />
          {searchQuery && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => setSearchQuery('')}
                rounded="full"
                size="icon-xxs"
                variant="ghost"
                className="hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
              >
                <X size={13} />
              </Button>
            </div>
          )}
        </div>
      )}

      <div ref={listRef as any} className="max-h-60 overflow-y-auto p-1 space-y-0.5">
        {children}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(dropdownEl, document.body) : null;
}
Menu.displayName = 'SelectMenu';

export function Option({
  children,
  value,
  disabled,
  icon,
  description,
  className,
  ...props
}: SelectOptionProps) {
  const context = useSelectContext();
  const {
    selectedValues,
    handleSelectOption,
    focusedIndex,
    setFocusedIndex,
    filteredOptions,
    searchQuery,
    setRegisteredOptions,
  } = context;

  React.useEffect(() => {
    setRegisteredOptions((prev) => {
      if (prev.some((o) => o.value === value)) return prev;
      return [...prev, { value, label: children as string, icon, description, disabled }];
    });
    return () => {
      setRegisteredOptions((prev) => prev.filter((o) => o.value !== value));
    };
  }, [value, children, icon, description, disabled, setRegisteredOptions]);

  const visibleIndex = filteredOptions.findIndex((o) => o.value === value);
  const isSelected = selectedValues.includes(value);
  const isFocused = visibleIndex === focusedIndex;

  if (searchQuery && visibleIndex === -1) {
    return null;
  }

  return (
    <div
      onClick={() => {
        if (!disabled) handleSelectOption(value);
      }}
      onMouseEnter={() => {
        if (visibleIndex >= 0) setFocusedIndex(visibleIndex);
      }}
      className={cn(
        'relative flex items-center justify-between pl-5 pr-3 py-2 text-xs font-medium cursor-pointer rounded transition-all duration-75 active:scale-[0.98] select-none',
        disabled && 'opacity-90 cursor-default pointer-events-none',
        isSelected
          ? 'bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[var(--color-primary)] font-semibold'
          : isFocused
            ? 'bg-[var(--color-accent)] text-[var(--color-foreground)]'
            : 'text-[var(--color-foreground)]',
        className
      )}
      {...props}
    >
      {isSelected && (
        <span className="absolute left-1.5 top-2 bottom-2 w-[3px] rounded-full bg-[var(--color-primary)] animate-in fade-in slide-in-from-left-1 duration-200" />
      )}

      <DefaultOptionRenderer
        icon={icon}
        label={children as string}
        description={description}
        isSelected={isSelected}
      />

      {isSelected && (
        <Check size={14} className="shrink-0 ml-2 animate-in fade-in zoom-in-75 duration-200" />
      )}
    </div>
  );
}
Option.displayName = 'SelectOption';

export const Select = React.forwardRef(SelectInner) as unknown as (<T = string>(
  props: SelectProps<T> & { ref?: React.Ref<HTMLButtonElement> }
) => React.ReactElement) & {
  Trigger: typeof Trigger;
  Menu: typeof Menu;
  Option: typeof Option;
};

(Select as any).displayName = 'Select';
(Select as any).Trigger = Trigger;
(Select as any).Menu = Menu;
(Select as any).Option = Option;

export default Select;
