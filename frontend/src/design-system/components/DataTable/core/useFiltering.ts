import { useDataTable } from './useDataTable';
import type { DataTableFilter } from '../DataTable.types';

export function useFiltering() {
  const { query, handleQueryChange } = useDataTable<any>();
  const { filters } = query;

  const setFilter = (id: string, filter: Partial<DataTableFilter> | null) => {
    let nextFilters: DataTableFilter[] = [];

    if (filter === null) {
      nextFilters = filters.filter((f) => f.id !== id);
    } else {
      const exists = filters.some((f) => f.id === id);
      if (exists) {
        nextFilters = filters.map((f) =>
          f.id === id ? ({ ...f, ...filter } as DataTableFilter) : f
        );
      } else {
        nextFilters = [
          ...filters,
          { id, key: id, operator: 'equals', value: '', ...filter } as DataTableFilter,
        ];
      }
    }

    handleQueryChange({ filters: nextFilters, page: 0 });
  };

  const removeFilter = (id: string) => {
    setFilter(id, null);
  };

  const clearFilters = () => {
    handleQueryChange({ filters: [], page: 0 });
  };

  return {
    filters,
    setFilter,
    removeFilter,
    clearFilters,
  };
}
