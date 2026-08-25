import * as React from 'react';
import { useDataTable } from '../core/useDataTable';
import { useSorting } from '../core/useSorting';
import { SelectionHeader } from '../features/selection/SelectionHeader';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DataTableHeader() {
  const { visibleColumns, selectable } = useDataTable<any>();
  const { toggleSort, getSortDirection } = useSorting();

  return (
    <thead className="datatable-head">
      <tr>
        {selectable && <SelectionHeader />}
        {visibleColumns.map((col) => {
          if (col.headerCell) {
            return col.headerCell({ column: col });
          }
          const direction = getSortDirection(col.id);
          const isSorted = !!direction;
          const isSortable = !!col.sortable;
          const alignClass =
            col.align === 'center'
              ? 'align-center'
              : col.align === 'right'
                ? 'align-right'
                : 'align-left';

          return (
            <th
              key={col.id}
              scope="col"
              className={alignClass}
              style={{
                width: col.width,
                minWidth: col.minWidth,
                maxWidth: col.maxWidth,
                cursor: isSortable ? 'pointer' : undefined,
                userSelect: isSortable ? 'none' : undefined,
              }}
              onClick={() => isSortable && toggleSort(col.id)}
            >
              <div
                className={cn(
                  'flex items-center gap-1.5',
                  col.align === 'center'
                    ? 'justify-center'
                    : col.align === 'right'
                      ? 'justify-end'
                      : 'justify-start'
                )}
              >
                <span>{col.header ?? col.label}</span>
                {isSortable && (
                  <span
                    style={{
                      display: 'inline-flex',
                      opacity: isSorted ? 1 : 0.35,
                      color: isSorted ? 'var(--color-primary)' : undefined,
                    }}
                  >
                    {isSorted && direction === 'asc' && <ArrowUp size={13} />}
                    {isSorted && direction === 'desc' && <ArrowDown size={13} />}
                    {!isSorted && <ArrowUpDown size={13} />}
                  </span>
                )}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
