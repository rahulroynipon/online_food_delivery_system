import * as React from 'react';
import { useDataTable } from '../core/useDataTable';

export function DataTableSkeleton() {
  const { visibleColumns, selectable, skeletonRows, isMobile } = useDataTable<any>();

  if (isMobile) {
    return (
      <div className="space-y-3 w-full">
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-3"
          >
            <div className="h-3 bg-slate-200 rounded w-1/4" />
            <div className="grid grid-cols-2 gap-3">
              {visibleColumns.slice(0, 4).map((col) => (
                <div key={col.id} className="space-y-1">
                  <div className="h-2 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {Array.from({ length: skeletonRows }).map((_, i) => (
        <tr key={i} className="datatable-row">
          {selectable && (
            <td className="datatable-col-select">
              <div
                className="datatable-skeleton"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 'var(--radius-sm)',
                  margin: '0 auto',
                }}
              />
            </td>
          )}
          {visibleColumns.map((col) => (
            <td
              key={col.id}
              style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.maxWidth }}
            >
              <div className="datatable-skeleton" style={{ width: '70%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
