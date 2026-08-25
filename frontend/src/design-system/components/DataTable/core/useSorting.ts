import { useDataTable } from './useDataTable';
import type { SortDirection } from '../DataTable.types';

export function useSorting() {
  const { query, handleQueryChange, columns } = useDataTable<any>();
  const { sorting } = query;

  const toggleSort = (colId: string) => {
    const col = columns.find((c) => c.id === colId);
    if (!col || !col.sortable) return;

    const activeSort = sorting.find((s) => s.id === colId);
    const sortKey = col.sortKey ?? col.accessorKey ?? col.id;

    let nextSorting: typeof sorting = [];

    if (!activeSort) {
      nextSorting = [{ id: colId, key: sortKey, direction: 'asc' }];
    } else if (activeSort.direction === 'asc') {
      nextSorting = [{ id: colId, key: sortKey, direction: 'desc' }];
    } else {
      // "desc" transitions to unsorted
      nextSorting = [];
    }

    handleQueryChange({ sorting: nextSorting, page: 0 });
  };

  const getSortDirection = (colId: string): SortDirection | undefined => {
    const activeSort = sorting.find((s) => s.id === colId);
    return activeSort?.direction;
  };

  return {
    sorting,
    toggleSort,
    getSortDirection,
  };
}
