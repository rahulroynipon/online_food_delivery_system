import { useDataTable } from './useDataTable';

export function usePagination() {
  const { query, handleQueryChange, meta } = useDataTable<any>();
  const { page, pageSize } = query;
  const totalRows = meta.totalRows ?? 0;
  const totalPages = meta.totalPages ?? 1;

  const goToPage = (p: number) => {
    const target = Math.max(0, Math.min(totalPages - 1, p));
    handleQueryChange({ page: target });
  };

  const setPageSize = (size: number) => {
    handleQueryChange({ pageSize: size, page: 0 });
  };

  const nextPage = () => {
    if (page < totalPages - 1) {
      goToPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 0) {
      goToPage(page - 1);
    }
  };

  return {
    page,
    pageSize,
    totalRows,
    totalPages,
    goToPage,
    setPageSize,
    nextPage,
    prevPage,
    canNextPage: page < totalPages - 1,
    canPrevPage: page > 0,
  };
}
