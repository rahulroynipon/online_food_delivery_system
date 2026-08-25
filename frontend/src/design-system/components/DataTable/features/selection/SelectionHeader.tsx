import * as React from 'react';
import { useSelection } from '../../core/useSelection';
import { Checkbox } from '../../../Checkbox';

export function SelectionHeader() {
  const { allRowsSelected, someRowsSelected, toggleAllRowSelection } = useSelection();

  return (
    <th className="px-4 py-3 w-10 text-center select-none">
      <div className="inline-flex justify-center items-center">
        <Checkbox
          checked={allRowsSelected}
          indeterminate={someRowsSelected && !allRowsSelected}
          onCheckedChange={(checked) => toggleAllRowSelection(checked)}
          aria-label="Select all rows"
          size="sm"
        />
      </div>
    </th>
  );
}
