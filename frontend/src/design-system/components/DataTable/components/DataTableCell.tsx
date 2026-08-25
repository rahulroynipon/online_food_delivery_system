import * as React from 'react';
import type { DataTableCellContext } from '../DataTable.types';

interface DataTableCellProps<T> {
  context: DataTableCellContext<T>;
}

export function DataTableCell<T>({ context }: DataTableCellProps<T>) {
  const { column } = context;

  if (column.cell) {
    return <>{column.cell(context)}</>;
  }

  return <>{String(context.value ?? '')}</>;
}
