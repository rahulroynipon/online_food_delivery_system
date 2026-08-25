import * as React from 'react';
import type { SelectProps } from './select.types';

export function useSelect<T = string>({
  options = [],
  value,
  defaultValue,
  onValueChange,
  multiple = false,
  searchable = false,
  disabled = false,
  loading = false,
}: Partial<SelectProps<T>>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const [openDirection, setOpenDirection] = React.useState<'bottom' | 'top'>('bottom');

  const handleSetIsOpen = React.useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    setIsOpen((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (next && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const dropdownHeight = 280;

        if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
          setOpenDirection('top');
        } else {
          setOpenDirection('bottom');
        }
      }
      return next;
    });
  }, []);
  const [isHoveredClear, setIsHoveredClear] = React.useState(false);
  const [hoveredTagIndex, setHoveredTagIndex] = React.useState<number | null>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const [selectedValues, setSelectedValues] = React.useState<T[]>(() => {
    if (value !== undefined) {
      return Array.isArray(value) ? value : value ? [value] : [];
    }
    if (defaultValue !== undefined) {
      return Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : [];
    }
    return [];
  });

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValues(Array.isArray(value) ? value : value ? [value] : []);
    }
  }, [value]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideContainer = containerRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideContainer && !insideDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((opt) => {
      const labelMatch = opt.label?.toLowerCase().includes(q) ?? false;
      const descMatch =
        typeof opt.description === 'string' ? opt.description.toLowerCase().includes(q) : false;
      return labelMatch || descMatch;
    });
  }, [options, searchQuery]);

  React.useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
      if (searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    } else {
      setSearchQuery('');
      setFocusedIndex(-1);
    }
  }, [isOpen, searchable]);

  React.useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[focusedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  const handleSelectOption = React.useCallback(
    (optValue: T) => {
      let nextValues: T[];
      if (multiple) {
        if (selectedValues.includes(optValue)) {
          nextValues = selectedValues.filter((v) => v !== optValue);
        } else {
          nextValues = [...selectedValues, optValue];
        }
      } else {
        nextValues = [optValue];
        // Delay closing the menu briefly to allow visual confirmation of checkmark/selection state
        setTimeout(() => {
          setIsOpen(false);
        }, 150);
      }

      if (value === undefined) {
        setSelectedValues(nextValues);
      }
      if (onValueChange) {
        onValueChange(multiple ? nextValues : nextValues[0] || ('' as T));
      }
      triggerRef.current?.focus();
    },
    [multiple, selectedValues, value, onValueChange]
  );

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      let nextValues: T[] = [];
      if (defaultValue !== undefined) {
        nextValues = Array.isArray(defaultValue)
          ? defaultValue
          : defaultValue
            ? [defaultValue]
            : [];
      }
      if (value === undefined) {
        setSelectedValues(nextValues);
      }
      if (onValueChange) {
        onValueChange(multiple ? nextValues : (nextValues[0] ?? ('' as T)));
      }
      triggerRef.current?.focus();
    },
    [defaultValue, value, onValueChange, multiple]
  );

  const handleRemoveItem = React.useCallback(
    (e: React.MouseEvent, optValue: T) => {
      e.stopPropagation();
      const nextValues = selectedValues.filter((v) => v !== optValue);
      if (value === undefined) {
        setSelectedValues(nextValues);
      }
      if (onValueChange) {
        onValueChange(multiple ? nextValues : ('' as T));
      }
    },
    [selectedValues, value, onValueChange, multiple]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled || loading) return;

      if (!isOpen) {
        if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'Space') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
            const opt = filteredOptions[focusedIndex];
            if (!opt.disabled) handleSelectOption(opt.value);
          }
          break;
        case 'Escape':
        case 'Tab':
          setIsOpen(false);
          break;
      }
    },
    [disabled, loading, isOpen, filteredOptions, focusedIndex, handleSelectOption]
  );

  const selectedOptions = React.useMemo(() => {
    return options.filter((o) => selectedValues.includes(o.value));
  }, [options, selectedValues]);

  return {
    isOpen,
    setIsOpen: handleSetIsOpen,
    searchQuery,
    setSearchQuery,
    focusedIndex,
    setFocusedIndex,
    openDirection,
    isHoveredClear,
    setIsHoveredClear,
    hoveredTagIndex,
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
  };
}
