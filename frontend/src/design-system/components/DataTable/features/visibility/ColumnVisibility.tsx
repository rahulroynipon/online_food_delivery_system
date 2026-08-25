import * as React from 'react';
import { Columns } from 'lucide-react';
import { Dropdown } from '../../../Dropdown';
import { Checkbox, CheckboxGroup } from '../../../Checkbox';
import { Button, type ButtonProps } from '../../../Button';
import { useDataTable } from '../../core/useDataTable';

function getColumnLabel(col: {
  id: string;
  label?: React.ReactNode;
  header?: React.ReactNode;
  visibilityLabel?: string;
}): string {
  if (col.visibilityLabel) return col.visibilityLabel;
  const primaryLabel = col.header ?? col.label;
  if (typeof primaryLabel === 'string') return primaryLabel;
  return col.id;
}

export interface ColumnVisibilityProps {
  /** Dropdown menu alignment */
  align?: 'start' | 'center' | 'end';
  /** Props passed to the default button trigger */
  buttonProps?: Partial<ButtonProps>;
  /** Custom label for the button trigger */
  label?: React.ReactNode;
}

export function ColumnVisibility({
  align = 'end',
  buttonProps = {},
  label = 'Columns',
}: ColumnVisibilityProps) {
  const {
    columns: allColumns,
    columnVisibility,
    toggleColumnVisibility,
    setColumnVisibility,
  } = useDataTable<any>();

  // Filter columns that are hideable
  const hideableColumns = React.useMemo(() => {
    return allColumns.filter((col) => col.hideable !== false);
  }, [allColumns]);

  // Derive checked IDs from columns visibility
  const checkedIds = React.useMemo(() => {
    const visible = new Set<string>();
    hideableColumns.forEach((col) => {
      if (columnVisibility[col.id] !== false) {
        visible.add(col.id);
      }
    });
    return visible;
  }, [hideableColumns, columnVisibility]);

  // Sync checkboxes change back to column visibility state in a single bulk update
  const handleCheckedIdsChange = React.useCallback(
    (nextCheckedIds: Set<string>) => {
      const nextVisibility = { ...columnVisibility };
      hideableColumns.forEach((col) => {
        nextVisibility[col.id] = nextCheckedIds.has(col.id);
      });
      setColumnVisibility(nextVisibility);
    },
    [hideableColumns, columnVisibility, setColumnVisibility]
  );

  const allChecked = checkedIds.size === hideableColumns.length;
  const someChecked = checkedIds.size > 0;
  const indeterminate = someChecked && !allChecked;

  const handleMasterChange = React.useCallback(
    (checked: boolean) => {
      const nextChecked = new Set<string>();
      if (checked) {
        hideableColumns.forEach((col) => nextChecked.add(col.id));
      }
      handleCheckedIdsChange(nextChecked);
    },
    [hideableColumns, handleCheckedIdsChange]
  );

  const hiddenCount = hideableColumns.length - checkedIds.size;

  return (
    <Dropdown>
      {/* ── Trigger button ─────────────────────────────────────────────── */}
      <Dropdown.Trigger>
        <Button
          variant="outline"
          size="xs"
          leftIcon={<Columns size={14} />}
          aria-label="Toggle column visibility"
          title="Choose which columns to show"
          {...buttonProps}
        >
          <span className="flex items-center gap-1.5">
            {label}
            {hiddenCount > 0 && (
              <span className="flex h-[17px] min-w-[17px] px-1 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white leading-none shrink-0">
                {hiddenCount}
              </span>
            )}
          </span>
        </Button>
      </Dropdown.Trigger>

      {/* ── Dropdown menu with CheckboxGroup context ────────────────────── */}
      <Dropdown.Menu align={align} width={220}>
        <CheckboxGroup checkedIds={checkedIds} onCheckedIdsChange={handleCheckedIdsChange}>
          <Dropdown.Header className="py-1">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Checkbox
                ignoreGroup
                checked={allChecked}
                indeterminate={indeterminate}
                onCheckedChange={handleMasterChange}
                label="All Columns"
                size="sm"
                className="w-full font-semibold text-[var(--color-foreground)]"
              />
            </div>
          </Dropdown.Header>

          {/* One item per column */}
          {hideableColumns.map((col) => {
            const isVisible = columnVisibility[col.id] !== false;
            const displayLabel = getColumnLabel(col as any);

            return (
              <Dropdown.Item
                key={col.id}
                closeOnClick={false}
                onClick={() => toggleColumnVisibility(col.id)}
                className="py-0.5"
                content={
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleColumnVisibility(col.id);
                    }}
                  >
                    <Checkbox value={col.id} size="sm" className="w-auto" />
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        color: isVisible
                          ? 'var(--color-foreground)'
                          : 'var(--color-muted-foreground)',
                        textDecoration: isVisible ? 'none' : 'line-through',
                        opacity: isVisible ? 1 : 0.7,
                      }}
                    >
                      {displayLabel}
                    </span>
                  </div>
                }
              />
            );
          })}
        </CheckboxGroup>
      </Dropdown.Menu>
    </Dropdown>
  );
}
