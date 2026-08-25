import * as React from 'react';
import { X } from 'lucide-react';
import type { SelectOption } from './select.types';

interface MultiValueRendererProps<T = string> {
  selectedOptions: SelectOption<T>[];
  disabled?: boolean;
  handleRemoveItem: (e: React.MouseEvent, value: T) => void;
  setHoveredTagIndex: (idx: number | null) => void;
}

export function MultiValueRenderer<T = string>({
  selectedOptions,
  disabled = false,
  handleRemoveItem,
  setHoveredTagIndex,
}: MultiValueRendererProps<T>) {
  return (
    <>
      {selectedOptions.map((opt, idx) => (
        <span
          key={opt.value as string}
          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded shadow-sm shrink-0 border bg-[var(--color-muted)] border-[var(--color-border)] text-[var(--color-foreground)]"
        >
          {opt.icon && <span className="mr-0.5">{opt.icon}</span>}
          {opt.label}
          {!disabled && (
            <span
              onClick={(e) => handleRemoveItem(e, opt.value)}
              onMouseEnter={() => setHoveredTagIndex(idx)}
              onMouseLeave={() => setHoveredTagIndex(null)}
              className="cursor-pointer p-0.5 rounded-full inline-flex items-center justify-center transition-colors ml-0.5 hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X size={10} />
            </span>
          )}
        </span>
      ))}
    </>
  );
}
