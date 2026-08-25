import * as React from 'react';
import { useSelection } from '../../core/useSelection';
import { Checkbox } from '../../../Checkbox';

interface SelectionCellProps {
  rowId: string;
  label?: string;
}

export function SelectionCell({ rowId, label = 'Select row' }: SelectionCellProps) {
  const { isRowSelected, toggleRowSelection } = useSelection();

  return (
    <td
      className="px-4 py-3 w-10 text-center select-none"
      onClick={(e) => {
        e.stopPropagation();
        toggleRowSelection(rowId);
      }}
    >
      <div className="inline-flex justify-center items-center">
        <Checkbox
          checked={isRowSelected(rowId)}
          onCheckedChange={() => {}} // Parent td click event handles selection toggle
          aria-label={label}
          size="sm"
        />
      </div>
    </td>
  );
}
