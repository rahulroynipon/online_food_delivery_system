import * as React from 'react';
import { useDataTable } from '../core/useDataTable';
import { DataTableHeader } from './DataTableHeader';
import { DataTableBody } from './DataTableBody';
import { cn } from '@/lib/utils';

export function DataTableDesktop() {
  const { bordered, striped, hoverable, density, stickyHeader } = useDataTable<any>();

  return (
    <div
      className={cn('datatable-container', stickyHeader && 'datatable-sticky-container')}
      style={
        stickyHeader
          ? { maxHeight: '480px', overflowY: 'auto', overflowX: 'auto' }
          : { overflowX: 'auto' }
      }
    >
      <table
        className={cn(
          'datatable',
          `density-${density ?? 'comfortable'}`,
          striped && 'striped',
          bordered && 'bordered',
          hoverable && 'hoverable',
          stickyHeader && 'datatable-sticky'
        )}
      >
        <DataTableHeader />
        <DataTableBody />
      </table>
    </div>
  );
}
