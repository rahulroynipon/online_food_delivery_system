import * as React from 'react';

export type DataTableMode = 'client' | 'server';

export type DataTableDensity = 'compact' | 'comfortable' | 'spacious';

export type DataTableBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type SortDirection = 'asc' | 'desc';

export interface DataTableSort {
  id: string;
  key: string;
  direction: SortDirection;
}

export interface DataTableFilter {
  id: string;
  key: string;
  operator: string;
  value: unknown;
}

export interface DataTableQuery {
  page: number;
  pageSize: number;
  search: string;
  sorting: DataTableSort[];
  filters: DataTableFilter[];
}

export interface DataTableMeta {
  totalRows?: number;
  totalPages?: number;
}

export interface DataTableCellContext<T> {
  row: T;
  value: unknown;
  column: DataTableColumn<T>;
  rowIndex: number;
}

export interface DataTableHeaderContext<T> {
  column: DataTableColumn<T>;
}

export interface DataTableColumn<T> {
  /**
   * Unique column identifier.
   */
  id: string;

  /**
   * Header content.
   */
  header?: React.ReactNode;
  label?: React.ReactNode;

  /**
   * Simple property accessor. Supports nested paths like "user.profile.name".
   */
  accessorKey?: string;

  /**
   * Dynamic accessor.
   */
  accessorFn?: (row: T) => unknown;

  /**
   * Sorting.
   */
  sortable?: boolean;

  /**
   * Backend sorting field.
   */
  sortKey?: string;

  /**
   * Search.
   */
  searchable?: boolean;

  /**
   * Backend search field.
   */
  searchKey?: string;

  /**
   * Filtering.
   */
  filterable?: boolean;

  /**
   * Backend filter field.
   */
  filterKey?: string;

  /**
   * Whether user can hide this column.
   */
  hideable?: boolean;

  /**
   * Desktop width.
   */
  width?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  align?: 'left' | 'center' | 'right';

  /**
   * Custom cell renderer.
   */
  cell?: (context: DataTableCellContext<T>) => React.ReactNode;

  /**
   * Custom header renderer.
   */
  headerCell?: (context: DataTableHeaderContext<T>) => React.ReactNode;

  /**
   * Mobile configuration.
   */
  mobile?: {
    hidden?: boolean;

    /**
     * Smaller number = higher priority.
     */
    priority?: number;

    /**
     * Custom mobile rendering.
     */
    render?: (context: DataTableCellContext<T>) => React.ReactNode;
  };
}

export interface DataTableProps<T> {
  /**
   * Data rows.
   */
  data: T[];

  /**
   * Column definitions.
   */
  columns: DataTableColumn<T>[];

  /**
   * Data processing mode.
   * client: DataTable processes data locally.
   * server: Parent/API handles data processing.
   */
  mode?: DataTableMode;

  /**
   * Stable row identifier.
   */
  getRowId?: (row: T, index: number) => string;

  /**
   * Server metadata.
   */
  meta?: DataTableMeta;

  /**
   * Query state.
   */
  query?: DataTableQuery;

  defaultQuery?: Partial<DataTableQuery>;

  /**
   * Unified query callback.
   */
  onQueryChange?: (query: DataTableQuery) => void;

  /**
   * Convenience callbacks.
   */
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortChange?: (sorting: DataTableSort[]) => void;
  onSearchChange?: (search: string) => void;
  onFilterChange?: (filters: DataTableFilter[]) => void;
  sortBy?: string;
  sortDirection?: SortDirection | null;

  /**
   * Selection.
   */
  selectable?: boolean;
  selectedRowIds?: Set<string>;
  defaultSelectedRowIds?: Set<string>;
  onSelectedRowIdsChange?: (ids: Set<string>) => void;

  /**
   * Column visibility.
   */
  columnVisibility?: Record<string, boolean>;
  defaultColumnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  hiddenColumns?: string[];
  onHiddenColumnsChange?: (ids: string[]) => void;
  tableName?: string;

  /**
   * Responsive.
   */
  mobileBreakpoint?: DataTableBreakpoint;
  renderMobileCard?: (props: {
    row: T;
    index: number;
    columns: DataTableColumn<T>[];
    selected: boolean;
  }) => React.ReactNode;

  /**
   * Row customization.
   */
  rowClassName?: (row: T, index: number) => string;

  /**
   * UI.
   */
  density?: DataTableDensity;
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;

  /**
   * Features.
   */
  searchable?: boolean;
  filterable?: boolean;
  pagination?: boolean | PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  stickyHeader?: boolean;

  /**
   * Loading.
   */
  loading?: boolean;
  loadingMode?: 'skeleton' | 'overlay';
  skeletonRows?: number;

  /**
   * Empty state.
   */
  emptyState?: React.ReactNode;

  /**
   * Custom toolbar.
   */
  toolbar?: React.ReactNode;

  /**
   * Class names.
   */
  className?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
