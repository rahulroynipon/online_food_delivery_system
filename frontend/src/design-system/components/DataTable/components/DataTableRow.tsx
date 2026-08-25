import * as React from 'react';
import { useDataTable } from '../core/useDataTable';
import { SelectionCell } from '../features/selection/SelectionCell';
import { DataTableCell } from './DataTableCell';
import { getValue } from '../utils/getValue';
import { cn } from '@/lib/utils';

interface DataTableRowProps<T> {
  row: T;
  rowIndex: number;
}

export function DataTableRow<T>({ row, rowIndex }: DataTableRowProps<T>) {
  const { visibleColumns, selectable, getRowId, isRowSelected, rowClassName } = useDataTable<T>();

  const rowId = getRowId(row, rowIndex);
  const isSelected = isRowSelected(rowId);

  return (
    <tr className={cn('datatable-row', isSelected && 'is-selected', rowClassName?.(row, rowIndex))}>
      {selectable && <SelectionCell rowId={rowId} />}
      {visibleColumns.map((col) => {
        const val = col.accessorFn ? col.accessorFn(row) : getValue(row, col.accessorKey);
        const cellContext = { row, value: val, column: col, rowIndex };
        const alignClass =
          col.align === 'center'
            ? 'align-center'
            : col.align === 'right'
              ? 'align-right'
              : 'align-left';

        return (
          <td
            key={col.id}
            className={alignClass}
            style={{
              width: col.width,
              minWidth: col.minWidth,
              maxWidth: col.maxWidth,
            }}
          >
            <DataTableCell context={cellContext} />
          </td>
        );
      })}
    </tr>
  );
}
