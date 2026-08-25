import * as React from 'react';
import { useDataTableState } from './core/useDataTableState';
import { DataTableContext } from './DataTableContext';
import { DataTableDesktop } from './components/DataTableDesktop';
import { DataTableMobile } from './components/DataTableMobile';
import { DataTableToolbar } from './components/DataTableToolbar';
import { DataTablePagination } from './components/DataTablePagination';
import { DataTableLoading } from './components/DataTableLoading';
import { cn } from '@/lib/utils';
import type { DataTableProps } from './DataTable.types';
import './dataTable.css';

export function DataTable<T>(props: DataTableProps<T>) {
  const state = useDataTableState(props);

  const {
    pagination = true,
    loadingMode = 'skeleton',
    skeletonRows = 5,
    toolbar,
    className,
  } = props;

  // Merge default configurations and state
  const contextValue = React.useMemo(
    () => ({
      ...state,
      data: state.processedData,
      columns: props.columns,
      mode: props.mode ?? 'client',
      mobileBreakpoint: props.mobileBreakpoint ?? 'md',
      selectable: props.selectable ?? false,
      density: props.density ?? 'comfortable',
      striped: props.striped ?? false,
      bordered: props.bordered ?? false,
      hoverable: props.hoverable ?? true,
      stickyHeader: props.stickyHeader ?? false,
      searchable: props.searchable ?? true,
      filterable: props.filterable ?? false,
      pagination: !!pagination,
      loading: props.loading ?? false,
      loadingMode,
      skeletonRows,
      emptyState: props.emptyState,
      renderMobileCard: props.renderMobileCard,
      rowClassName: props.rowClassName,
    }),
    [
      state,
      props.columns,
      props.mode,
      props.mobileBreakpoint,
      props.selectable,
      props.density,
      props.striped,
      props.bordered,
      props.hoverable,
      props.stickyHeader,
      props.searchable,
      props.filterable,
      pagination,
      props.loading,
      loadingMode,
      skeletonRows,
      props.emptyState,
      props.renderMobileCard,
      props.rowClassName,
    ]
  );

  const renderContent = () => {
    if (state.isMobile) {
      return <DataTableMobile />;
    }
    return <DataTableDesktop />;
  };

  return (
    <DataTableContext.Provider value={contextValue}>
      {/* Compositional Toolbar */}
      {toolbar !== undefined ? (
        toolbar && <div className="datatable-toolbar">{toolbar}</div>
      ) : (
        <DataTableToolbar />
      )}

      <div className={cn('datatable-wrapper', state.isMobile && 'is-mobile', className)}>
        {/* Content Area */}
        <div className="relative w-full flex-1">
          {renderContent()}
          <DataTableLoading />
        </div>

        {/* Pagination Bar */}
        {pagination && <DataTablePagination />}
      </div>
    </DataTableContext.Provider>
  );
}

DataTable.displayName = 'DataTable';
