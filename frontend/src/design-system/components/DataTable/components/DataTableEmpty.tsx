import * as React from 'react';
import { useDataTable } from '../core/useDataTable';

interface DataTableEmptyProps {
  asRow?: boolean;
}

export function DataTableEmpty({ asRow = false }: DataTableEmptyProps) {
  const { emptyState, visibleColumns, selectable } = useDataTable<any>();

  const content = emptyState || (
    <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-slate-400 font-medium bg-white w-full">
      No data found
    </div>
  );

  if (asRow) {
    const colSpan = visibleColumns.length + (selectable ? 1 : 0);
    return (
      <tr>
        <td colSpan={colSpan} className="p-0 border-0 bg-transparent">
          {content}
        </td>
      </tr>
    );
  }

  return <>{content}</>;
}
