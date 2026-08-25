import type { DataTableSort, DataTableColumn } from '../DataTable.types';
import { getValue } from './getValue';

export function applySorting<T>(
  rows: T[],
  sorting: DataTableSort[],
  columns: DataTableColumn<T>[]
): T[] {
  if (!sorting || sorting.length === 0) return rows;

  const sorted = [...rows];
  const activeSort = sorting[0];
  const column = columns.find((c) => c.id === activeSort.id);
  if (!column) return rows;

  sorted.sort((a, b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let valA = column.accessorFn ? column.accessorFn(a) : getValue(a, column.accessorKey);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let valB = column.accessorFn ? column.accessorFn(b) : getValue(b, column.accessorKey);

    if (valA === valB) return 0;
    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    const isAsc = activeSort.direction === 'asc';

    if (typeof valA === 'string' && typeof valB === 'string') {
      return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    return isAsc ? (valA < valB ? -1 : 1) : valA > valB ? -1 : 1;
  });

  return sorted;
}
