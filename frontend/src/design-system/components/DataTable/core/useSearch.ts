import { useDataTable } from './useDataTable';

export function useSearch() {
  const { query, handleQueryChange } = useDataTable<any>();
  const { search } = query;

  const setSearch = (value: string) => {
    handleQueryChange({ search: value, page: 0 });
  };

  const clearSearch = () => {
    setSearch('');
  };

  return {
    search,
    setSearch,
    clearSearch,
  };
}
