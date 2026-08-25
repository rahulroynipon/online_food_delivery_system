import * as React from 'react';
import type {
  DataTableColumn,
  DataTableMode,
  DataTableQuery,
  DataTableMeta,
  DataTableDensity,
  DataTableBreakpoint,
} from './DataTable.types';

export interface DataTableContextValue<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  visibleColumns: DataTableColumn<T>[];
  mode: DataTableMode;
  getRowId: (row: T, index: number) => string;
  meta: DataTableMeta;

  // Query
  query: DataTableQuery;
  setQuery: React.Dispatch<React.SetStateAction<DataTableQuery>>;
  handleQueryChange: (
    updater: Partial<DataTableQuery> | ((prev: DataTableQuery) => Partial<DataTableQuery>)
  ) => void;

  // Selection
  selectable: boolean;
  selectedRowIds: Set<string>;
  toggleRowSelection: (id: string, value?: boolean) => void;
  toggleAllRowSelection: (value: boolean) => void;
  isRowSelected: (id: string) => boolean;
  allRowsSelected: boolean;
  someRowsSelected: boolean;

  // Column Visibility
  columnVisibility: Record<string, boolean>;
  toggleColumnVisibility: (id: string) => void;
  setColumnVisibility: (
    next: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => void;

  // UI
  density: DataTableDensity;
  striped: boolean;
  bordered: boolean;
  hoverable: boolean;
  stickyHeader: boolean;
  mobileBreakpoint: DataTableBreakpoint;
  isMobile: boolean;

  // Features
  searchable: boolean;
  filterable: boolean;
  pagination: boolean;

  // Loading
  loading: boolean;
  loadingMode: 'skeleton' | 'overlay';
  skeletonRows: number;
  emptyState: React.ReactNode;

  // Custom renderers/classes passed down
  renderMobileCard?: (props: {
    row: T;
    index: number;
    columns: DataTableColumn<T>[];
    selected: boolean;
  }) => React.ReactNode;
  rowClassName?: (row: T, index: number) => string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DataTableContext = React.createContext<DataTableContextValue<any> | null>(null);

export function useDataTableContext<T>(): DataTableContextValue<T> {
  const context = React.useContext(DataTableContext);
  if (!context) {
    throw new Error('DataTable sub-components must be rendered within a <DataTable> provider.');
  }
  return context as DataTableContextValue<T>;
}
