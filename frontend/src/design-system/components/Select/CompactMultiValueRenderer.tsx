import * as React from 'react';
import { X } from 'lucide-react';
import type { SelectOption } from './select.types';

interface CompactMultiValueRendererProps<T = string> {
  selectedOptions: SelectOption<T>[];
  disabled?: boolean;
  handleRemoveItem: (e: React.MouseEvent, value: T) => void;
  setHoveredTagIndex: (idx: number | null) => void;
  maxVisibleTags?: number;
}

export function CompactMultiValueRenderer<T = string>({
  selectedOptions,
  disabled = false,
  handleRemoveItem,
  setHoveredTagIndex,
  maxVisibleTags = 2,
}: CompactMultiValueRendererProps<T>) {
  if (selectedOptions.length === 0) return null;

  // If maxVisibleTags is 0 or less, render text version like "8 selected"
  if (maxVisibleTags <= 0) {
    return (
      <span className="text-sm font-medium text-[var(--color-foreground)] truncate">
        {selectedOptions.length} selected
      </span>
    );
  }

  const visibleOptions = selectedOptions.slice(0, maxVisibleTags);
  const remainingCount = selectedOptions.length - maxVisibleTags;

  return (
    <>
      {visibleOptions.map((opt, idx) => (
        <span
          key={opt.value as string}
          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded shadow-sm shrink-0 border bg-[var(--color-muted)] border-[var(--color-border)] text-[var(--color-foreground)] max-w-[120px] truncate"
        >
          {opt.icon && <span className="mr-0.5 shrink-0">{opt.icon}</span>}
          <span className="truncate">{opt.label}</span>
          {!disabled && (
            <span
              onClick={(e) => handleRemoveItem(e, opt.value)}
              onMouseEnter={() => setHoveredTagIndex(idx)}
              onMouseLeave={() => setHoveredTagIndex(null)}
              className="cursor-pointer p-0.5 rounded-full inline-flex items-center justify-center transition-colors ml-0.5 hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
            >
              <X size={10} />
            </span>
          )}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] shrink-0 select-none">
          +{remainingCount}
        </span>
      )}
    </>
  );
}
