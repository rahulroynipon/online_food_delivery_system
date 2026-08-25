import type { DataTableFilter, DataTableColumn } from '../DataTable.types';
import { getValue } from './getValue';

export function applySearch<T>(rows: T[], search: string, columns: DataTableColumn<T>[]): T[] {
  if (!search) return rows;

  const query = search.toLowerCase().trim();
  return rows.filter((row) => {
    return columns.some((col) => {
      if (col.searchable === false) return false;

      const val = col.accessorFn ? col.accessorFn(row) : getValue(row, col.accessorKey);
      if (val === undefined || val === null) return false;

      return String(val).toLowerCase().includes(query);
    });
  });
}

export function applyFilters<T>(
  rows: T[],
  filters: DataTableFilter[],
  columns: DataTableColumn<T>[]
): T[] {
  if (!filters || filters.length === 0) return rows;

  return rows.filter((row) => {
    return filters.every((filter) => {
      const col = columns.find((c) => c.id === filter.id);
      if (!col) return true;

      const val = col.accessorFn ? col.accessorFn(row) : getValue(row, col.accessorKey);
      const filterVal = filter.value;

      switch (filter.operator) {
        case 'equals':
          return String(val) === String(filterVal);
        case 'contains':
          return String(val).toLowerCase().includes(String(filterVal).toLowerCase());
        case 'startsWith':
          return String(val).toLowerCase().startsWith(String(filterVal).toLowerCase());
        case 'endsWith':
          return String(val).toLowerCase().endsWith(String(filterVal).toLowerCase());
        default:
          return true;
      }
    });
  });
}
