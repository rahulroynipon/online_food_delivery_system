import * as React from 'react';
import { useDataTable } from '../core/useDataTable';
import { Search } from 'lucide-react';

interface DataTableToolbarProps {
  children?: React.ReactNode;
}

export function DataTableToolbar({ children }: DataTableToolbarProps) {
  const { searchable, query, handleQueryChange } = useDataTable<any>();

  if (children) {
    return (
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100 w-full justify-between">
        {children}
      </div>
    );
  }

  if (!searchable) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100 w-full justify-between">
      <div className="relative min-w-[240px] max-w-sm">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </span>
        <input
          type="text"
          placeholder="Search..."
          value={query.search || ''}
          onChange={(e) => handleQueryChange({ search: e.target.value, page: 0 })}
          className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 w-full bg-white text-slate-800"
        />
      </div>
    </div>
  );
}
