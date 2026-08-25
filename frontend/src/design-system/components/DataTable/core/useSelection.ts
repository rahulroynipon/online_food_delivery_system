import { useDataTable } from './useDataTable';

export function useSelection() {
  const {
    selectable,
    selectedRowIds,
    toggleRowSelection,
    toggleAllRowSelection,
    isRowSelected,
    allRowsSelected,
    someRowsSelected,
  } = useDataTable<any>();

  return {
    selectable,
    selectedRowIds,
    toggleRowSelection,
    toggleAllRowSelection,
    isRowSelected,
    allRowsSelected,
    someRowsSelected,
  };
}
