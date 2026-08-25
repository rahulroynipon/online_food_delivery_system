import type { DataTableColumn } from '../DataTable.types';

export function getVisibleColumns<T>(
  columns: DataTableColumn<T>[],
  columnVisibility: Record<string, boolean>
): DataTableColumn<T>[] {
  return columns.filter((col) => {
    return columnVisibility[col.id] !== false;
  });
}
