import * as React from 'react';
import { useSorting } from '../../core/useSorting';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

interface SortButtonProps {
  columnId: string;
}

export function SortButton({ columnId }: SortButtonProps) {
  const { toggleSort, getSortDirection } = useSorting();
  const direction = getSortDirection(columnId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleSort(columnId);
      }}
      className="inline-flex items-center ml-1 p-0.5 rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-300"
      aria-label={`Sort by column`}
      title={
        direction === 'asc'
          ? 'Sort descending'
          : direction === 'desc'
            ? 'Remove sort'
            : 'Sort ascending'
      }
    >
      {direction === 'asc' ? (
        <ArrowUp size={13} className="text-slate-700" />
      ) : direction === 'desc' ? (
        <ArrowDown size={13} className="text-slate-700" />
      ) : (
        <ArrowUpDown size={13} />
      )}
    </button>
  );
}
