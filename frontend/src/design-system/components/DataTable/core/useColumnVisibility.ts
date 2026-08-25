import { useDataTable } from './useDataTable';

export function useColumnVisibility() {
  const { columns, visibleColumns, columnVisibility, toggleColumnVisibility } = useDataTable<any>();

  return {
    columns,
    visibleColumns,
    columnVisibility,
    toggleColumnVisibility,
  };
}
