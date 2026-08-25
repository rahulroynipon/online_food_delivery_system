import * as React from 'react';
import { useDataTable } from '../core/useDataTable';
import { DataTableSkeleton } from './DataTableSkeleton';
import { DataTableEmpty } from './DataTableEmpty';
import { getValue } from '../utils/getValue';
import { Checkbox } from '../../Checkbox';
import { cn } from '@/lib/utils';

export function DataTableMobile() {
  const {
    data,
    visibleColumns,
    selectable,
    getRowId,
    isRowSelected,
    toggleRowSelection,
    loading,
    loadingMode,
    renderMobileCard,
  } = useDataTable<any>();

  const isSkeletonLoading = loading && loadingMode === 'skeleton';
  const isEmpty = data.length === 0 && !isSkeletonLoading;

  if (isSkeletonLoading) return <DataTableSkeleton />;
  if (isEmpty) return <DataTableEmpty />;

  const mobileCols = visibleColumns
    .filter((col) => !col.mobile?.hidden)
    .sort((a, b) => (a.mobile?.priority ?? 99) - (b.mobile?.priority ?? 99));

  return (
    <div className="datatable-mobile-container">
      {data.map((row, idx) => {
        const rowId = getRowId(row, idx);
        const selected = isRowSelected(rowId);

        if (renderMobileCard) {
          return (
            <div key={rowId}>
              {renderMobileCard({ row, index: idx, columns: visibleColumns, selected })}
            </div>
          );
        }

        const primaryCol = mobileCols[0];
        const remainingCols = mobileCols.slice(1);

        let primaryContent: React.ReactNode = null;
        if (primaryCol) {
          const primaryVal = primaryCol.accessorFn
            ? primaryCol.accessorFn(row)
            : getValue(row, primaryCol.accessorKey);
          primaryContent = primaryCol.mobile?.render
            ? primaryCol.mobile.render({
                row,
                value: primaryVal,
                column: primaryCol,
                rowIndex: idx,
              })
            : primaryCol.cell
              ? primaryCol.cell({ row, value: primaryVal, column: primaryCol, rowIndex: idx })
              : String(primaryVal ?? '');
        }

        return (
          <div
            key={rowId}
            onClick={() => selectable && toggleRowSelection(rowId)}
            className={cn('datatable-mobile-card', selected && 'is-selected')}
          >
            <div className="datatable-mobile-card-header">
              <div className="datatable-mobile-card-title-area">
                {selectable && (
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => {}} // toggled by outer click
                    size="sm"
                    className="!w-auto shrink-0"
                  />
                )}
                {primaryContent && (
                  <span className="datatable-mobile-card-title">{primaryContent}</span>
                )}
              </div>
              <span className="datatable-mobile-card-id">ID: {rowId}</span>
            </div>

            {remainingCols.length > 0 && (
              <div className="datatable-mobile-card-grid">
                {remainingCols.map((col) => {
                  const val = col.accessorFn ? col.accessorFn(row) : getValue(row, col.accessorKey);
                  const labelText =
                    typeof col.header === 'string'
                      ? col.header
                      : typeof col.label === 'string'
                        ? col.label
                        : col.id;

                  return (
                    <div key={col.id} className="datatable-mobile-card-field">
                      <span className="datatable-mobile-card-label">{labelText}</span>
                      <div className="datatable-mobile-card-value">
                        {col.mobile?.render
                          ? col.mobile.render({ row, value: val, column: col, rowIndex: idx })
                          : col.cell
                            ? col.cell({ row, value: val, column: col, rowIndex: idx })
                            : String(val ?? '')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
