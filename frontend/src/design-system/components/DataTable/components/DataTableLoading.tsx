import * as React from 'react';
import { useDataTable } from '../core/useDataTable';

export function DataTableLoading() {
  const { loading, loadingMode } = useDataTable<any>();

  if (!loading || loadingMode !== 'overlay') return null;

  return (
    <div
      className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center space-y-2">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        <span className="text-xs font-medium text-slate-500">Loading...</span>
      </div>
    </div>
  );
}
