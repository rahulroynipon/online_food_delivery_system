import * as React from 'react';
import { useDataTable } from '../core/useDataTable';
import { DataTableRow } from './DataTableRow';
import { DataTableSkeleton } from './DataTableSkeleton';
import { DataTableEmpty } from './DataTableEmpty';

export function DataTableBody() {
  const { data, loading, loadingMode } = useDataTable<any>();

  const isSkeletonLoading = loading && loadingMode === 'skeleton';
  const isEmpty = data.length === 0 && !isSkeletonLoading;

  return (
    <tbody className="datatable-body">
      {isSkeletonLoading && <DataTableSkeleton />}
      {isEmpty && <DataTableEmpty asRow />}
      {!isSkeletonLoading &&
        !isEmpty &&
        data.map((row, idx) => <DataTableRow key={idx} row={row} rowIndex={idx} />)}
    </tbody>
  );
}
