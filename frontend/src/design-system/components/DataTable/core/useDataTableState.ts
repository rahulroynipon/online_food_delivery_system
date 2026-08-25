import * as React from 'react';
import type { DataTableProps, DataTableQuery, DataTableMeta } from '../DataTable.types';
import { getRowId } from '../utils/getRowId';
import { applySearch, applyFilters } from '../utils/filtering';
import { applySorting } from '../utils/sorting';
import { applyPagination } from '../utils/pagination';
import { getVisibleColumns } from '../utils/columns';

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useDataTableState<T>(props: DataTableProps<T>) {
  const {
    data,
    columns,
    mode = 'client',
    getRowId: customGetRowId,
    meta,
    query: controlledQuery,
    defaultQuery,
    onQueryChange,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onSearchChange,
    onFilterChange,
    selectedRowIds: controlledSelectedRowIds,
    defaultSelectedRowIds,
    onSelectedRowIdsChange,
    columnVisibility: controlledColumnVisibility,
    defaultColumnVisibility,
    onColumnVisibilityChange,
    mobileBreakpoint = 'md',
    onPaginationChange,
  } = props;

  // 1. Query State
  const initialQuery = React.useMemo<DataTableQuery>(() => {
    const parentPage = typeof props.pagination === 'object' ? props.pagination.page : undefined;
    const parentPageSize =
      typeof props.pagination === 'object' ? props.pagination.limit : undefined;
    return {
      page: parentPage ?? 0,
      pageSize: parentPageSize ?? 10,
      search: '',
      sorting: [],
      filters: [],
      ...defaultQuery,
    };
  }, [defaultQuery, props.pagination]);

  const [localQuery, setLocalQuery] = React.useState<DataTableQuery>(initialQuery);

  const parentPage = typeof props.pagination === 'object' ? props.pagination.page : undefined;
  const parentPageSize = typeof props.pagination === 'object' ? props.pagination.limit : undefined;

  const query = React.useMemo(() => {
    const base = controlledQuery ?? localQuery;
    const sorting = props.sortBy
      ? [{ id: props.sortBy, key: props.sortBy, direction: props.sortDirection || 'asc' }]
      : base.sorting;
    return {
      ...base,
      page: parentPage !== undefined ? parentPage : base.page,
      pageSize: parentPageSize !== undefined ? parentPageSize : base.pageSize,
      sorting,
    };
  }, [controlledQuery, localQuery, parentPage, parentPageSize, props.sortBy, props.sortDirection]);

  // 2. Selection State
  const [localSelectedRowIds, setLocalSelectedRowIds] = React.useState<Set<string>>(
    () => defaultSelectedRowIds ?? new Set()
  );
  const selectedRowIds = controlledSelectedRowIds ?? localSelectedRowIds;

  const toggleRowSelection = React.useCallback(
    (id: string, value?: boolean) => {
      const next = new Set(selectedRowIds);
      const isSelected = next.has(id);
      const shouldSelect = value !== undefined ? value : !isSelected;

      if (shouldSelect) {
        next.add(id);
      } else {
        next.delete(id);
      }

      if (!controlledSelectedRowIds) {
        setLocalSelectedRowIds(next);
      }
      onSelectedRowIdsChange?.(next);
    },
    [selectedRowIds, controlledSelectedRowIds, onSelectedRowIdsChange]
  );

  // 3. Column Visibility State
  const [localColumnVisibility, setLocalColumnVisibility] = React.useState<Record<string, boolean>>(
    () => {
      if (props.tableName) {
        try {
          const cached = localStorage.getItem(`datatable_columns_${props.tableName}`);
          if (cached) {
            return JSON.parse(cached);
          }
        } catch (e) {
          console.error('Failed to load column visibility from localStorage', e);
        }
      }
      return defaultColumnVisibility ?? {};
    }
  );

  const columnVisibility = React.useMemo(() => {
    if (props.hiddenColumns) {
      const visibility: Record<string, boolean> = {};
      columns.forEach((c) => {
        visibility[c.id] = !props.hiddenColumns?.includes(c.id);
      });
      return visibility;
    }
    return controlledColumnVisibility ?? localColumnVisibility;
  }, [controlledColumnVisibility, localColumnVisibility, props.hiddenColumns, columns]);

  // Auto-persist column visibility to localStorage when tableName is provided
  React.useEffect(() => {
    if (props.tableName) {
      localStorage.setItem(
        `datatable_columns_${props.tableName}`,
        JSON.stringify(columnVisibility)
      );
    }
  }, [props.tableName, columnVisibility]);

  const setColumnVisibility = React.useCallback(
    (
      nextVisibility:
        Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
    ) => {
      const resolvedNext =
        typeof nextVisibility === 'function' ? nextVisibility(columnVisibility) : nextVisibility;
      if (props.hiddenColumns && props.onHiddenColumnsChange) {
        const nextHidden = columns.filter((c) => resolvedNext[c.id] === false).map((c) => c.id);
        props.onHiddenColumnsChange(nextHidden);
        return;
      }
      if (!controlledColumnVisibility) {
        setLocalColumnVisibility(resolvedNext);
      }
      onColumnVisibilityChange?.(resolvedNext);
    },
    [
      columnVisibility,
      controlledColumnVisibility,
      onColumnVisibilityChange,
      props.hiddenColumns,
      props.onHiddenColumnsChange,
      columns,
    ]
  );

  const toggleColumnVisibility = React.useCallback(
    (id: string) => {
      setColumnVisibility((prev) => ({
        ...prev,
        [id]: prev[id] === false,
      }));
    },
    [setColumnVisibility]
  );

  // 4. Breakpoint evaluation
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const width = BREAKPOINTS[mobileBreakpoint];
    const mediaQuery = window.matchMedia(`(max-width: ${width - 1}px)`);

    const update = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : mediaQuery.matches);
    };

    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, [mobileBreakpoint]);

  // Helper row resolver
  const getRowIdFn = React.useCallback(
    (row: T, index: number) => {
      return getRowId(row, index, customGetRowId);
    },
    [customGetRowId]
  );

  // 5. Data Processing Pipeline (Client-side vs Server-side)
  const processedData = React.useMemo(() => {
    if (mode === 'server') return data;

    let rows = [...data];
    rows = applySearch(rows, query.search, columns);
    rows = applyFilters(rows, query.filters, columns);
    rows = applySorting(rows, query.sorting, columns);
    return rows;
  }, [data, mode, query.search, query.filters, query.sorting, columns]);

  const paginatedData = React.useMemo(() => {
    if (mode === 'server') return data;
    return applyPagination(processedData, query.page, query.pageSize);
  }, [processedData, mode, query.page, query.pageSize, data]);

  // Computed Metadata
  const computedMeta = React.useMemo<DataTableMeta>(() => {
    if (mode === 'server') {
      return meta ?? {};
    }

    const totalRows = processedData.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / query.pageSize));
    return {
      totalRows,
      totalPages,
    };
  }, [mode, meta, processedData.length, query.pageSize]);

  const handleQueryChange = React.useCallback(
    (updater: Partial<DataTableQuery> | ((prev: DataTableQuery) => Partial<DataTableQuery>)) => {
      const nextQuery =
        typeof updater === 'function' ? { ...query, ...updater(query) } : { ...query, ...updater };

      if (!controlledQuery) {
        setLocalQuery(nextQuery);
      }

      onQueryChange?.(nextQuery);
      if (nextQuery.page !== query.page) onPageChange?.(nextQuery.page);
      if (nextQuery.pageSize !== query.pageSize) onPageSizeChange?.(nextQuery.pageSize);
      if (nextQuery.sorting !== query.sorting) onSortChange?.(nextQuery.sorting);
      if (nextQuery.search !== query.search) onSearchChange?.(nextQuery.search);
      if (nextQuery.filters !== query.filters) onFilterChange?.(nextQuery.filters);

      if (nextQuery.page !== query.page || nextQuery.pageSize !== query.pageSize) {
        onPaginationChange?.({
          page: nextQuery.page,
          limit: nextQuery.pageSize,
          totalElements: computedMeta.totalRows ?? 0,
          totalPages: computedMeta.totalPages ?? 1,
          last: nextQuery.page >= (computedMeta.totalPages ?? 1) - 1,
        });
      }
    },
    [
      query,
      controlledQuery,
      onQueryChange,
      onPageChange,
      onPageSizeChange,
      onSortChange,
      onSearchChange,
      onFilterChange,
      onPaginationChange,
      computedMeta,
    ]
  );

  // All selected states helper
  const pageRowIds = React.useMemo(() => {
    return paginatedData.map((row, idx) => getRowIdFn(row, idx));
  }, [paginatedData, getRowIdFn]);

  const allRowsSelected = React.useMemo(() => {
    if (pageRowIds.length === 0) return false;
    return pageRowIds.every((id) => selectedRowIds.has(id));
  }, [pageRowIds, selectedRowIds]);

  const someRowsSelected = React.useMemo(() => {
    if (allRowsSelected || pageRowIds.length === 0) return false;
    return pageRowIds.some((id) => selectedRowIds.has(id));
  }, [pageRowIds, selectedRowIds, allRowsSelected]);

  const toggleAllRowSelection = React.useCallback(
    (value: boolean) => {
      const next = new Set(selectedRowIds);
      pageRowIds.forEach((id) => {
        if (value) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });

      if (!controlledSelectedRowIds) {
        setLocalSelectedRowIds(next);
      }
      onSelectedRowIdsChange?.(next);
    },
    [pageRowIds, selectedRowIds, controlledSelectedRowIds, onSelectedRowIdsChange]
  );

  const isRowSelected = React.useCallback(
    (id: string) => {
      return selectedRowIds.has(id);
    },
    [selectedRowIds]
  );

  // Visible Columns
  const visibleColumns = React.useMemo(() => {
    return getVisibleColumns(columns, columnVisibility);
  }, [columns, columnVisibility]);

  return {
    processedData: paginatedData,
    visibleColumns,
    query,
    setQuery: setLocalQuery,
    handleQueryChange,
    selectedRowIds,
    toggleRowSelection,
    toggleAllRowSelection,
    isRowSelected,
    allRowsSelected,
    someRowsSelected,
    columnVisibility,
    toggleColumnVisibility,
    setColumnVisibility,
    isMobile,
    meta: computedMeta,
    getRowId: getRowIdFn,
  };
}
