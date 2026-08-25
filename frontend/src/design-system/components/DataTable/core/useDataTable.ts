import { useDataTableContext } from '../DataTableContext';

export function useDataTable<T>() {
  return useDataTableContext<T>();
}
