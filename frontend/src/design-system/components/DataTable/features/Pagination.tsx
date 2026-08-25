import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useDataTable } from '../core/useDataTable';
import { usePagination } from '../core/usePagination';
import { Button } from '../../Button';
import { Select } from '../../Select';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100].map((n) => ({
  value: String(n),
  label: String(n),
}));

/**
 * Compute the page numbers to display, inserting "ellipsis" markers.
 * Always shows first, last, current ±1, with "…" for large gaps.
 */
function getPageNumbers(
  current: number,
  total: number
): (number | 'ellipsis-start' | 'ellipsis-end')[] {
  if (total <= 1) return [];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);

  const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];

  if (current <= 3) {
    for (let i = 0; i <= 4; i++) pages.push(i);
    pages.push('ellipsis-end');
    pages.push(total - 1);
  } else if (current >= total - 4) {
    pages.push(0);
    pages.push('ellipsis-start');
    for (let i = total - 5; i < total; i++) pages.push(i);
  } else {
    pages.push(0);
    pages.push('ellipsis-start');
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push('ellipsis-end');
    pages.push(total - 1);
  }

  return pages;
}

/**
 * Full pagination bar using design-system Button + Select components.
 */
export function PaginationBar() {
  const {
    page,
    pageSize: limit,
    totalRows: totalElements,
    totalPages,
    goToPage,
    setPageSize: setLimit,
  } = usePagination();

  const from = totalElements === 0 ? 0 : page * limit + 1;
  const to = Math.min((page + 1) * limit, totalElements);
  const last = page === totalPages - 1;

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="datatable-pagination">
      <style>{`
        .datatable-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-4);
          background-color: var(--color-background, #fff);
          border-top: 1px solid var(--color-border, #e2e8f0);
          font-family: inherit;
          user-select: none;
        }
        .datatable-pagination-left {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
        }
        .datatable-pagination-right {
          display: flex;
          align-items: center;
          gap: var(--spacing-6);
        }
        .datatable-pagination-info {
          font-size: 0.75rem;
          color: var(--color-muted-foreground, #64748b);
        }
        .datatable-page-controls {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .datatable-page-ellipsis {
          font-size: 0.75rem;
          color: var(--color-muted-foreground, #94a3b8);
          padding: 0 4px;
        }
        /* Custom Select Trigger styling overrides for pagination */
        .datatable-pagination-left button {
          border-radius: var(--radius-xl, 12px) !important;
        }
      `}</style>

      {/* Left: rows per page */}
      <div className="datatable-pagination-left">
        <span className="datatable-pagination-info">Rows per page:</span>
        <Select
          options={PAGE_SIZE_OPTIONS}
          value={String(limit)}
          onValueChange={(val) => setLimit(Number(val))}
          size="xs"
          width={100}
          align="start"
          aria-label="Rows per page"
        />
      </div>

      {/* Right: info + page controls */}
      <div className="datatable-pagination-right">
        <span className="datatable-pagination-info">
          {from}–{to} of {totalElements.toLocaleString()}
        </span>

        <div className="datatable-page-controls">
          {/* First page */}
          <Button
            variant="ghost"
            rounded="full"
            className="!w-7 !h-7 !p-0 !min-w-[28px] !text-blue-600 hover:!bg-blue-50/50 disabled:!opacity-30 disabled:hover:!bg-transparent disabled:!text-slate-350"
            onClick={() => goToPage(0)}
            disabled={page === 0}
            aria-label="First page"
            title="First page"
          >
            <ChevronsLeft size={14} />
          </Button>

          {/* Previous page */}
          <Button
            variant="ghost"
            rounded="full"
            className="!w-7 !h-7 !p-0 !min-w-[28px] !text-blue-600 hover:!bg-blue-50/50 disabled:!opacity-30 disabled:hover:!bg-transparent disabled:!text-slate-350"
            onClick={() => goToPage(page - 1)}
            disabled={page === 0}
            aria-label="Previous page"
            title="Previous page"
          >
            <ChevronLeft size={14} />
          </Button>

          {/* Numbered pages */}
          {pageNumbers.map((p, idx) => {
            if (p === 'ellipsis-start' || p === 'ellipsis-end') {
              return (
                <span key={`${p}-${idx}`} className="datatable-page-ellipsis">
                  …
                </span>
              );
            }
            const isActive = p === page;
            return (
              <Button
                key={p}
                variant={isActive ? 'primary' : 'ghost'}
                rounded="full"
                className={`!w-7 !h-7 !p-0 !min-w-[28px] ${
                  isActive
                    ? '!bg-blue-600 !text-white !font-bold'
                    : '!text-blue-600 hover:!bg-blue-50/50'
                }`}
                onClick={() => goToPage(p)}
                aria-label={`Page ${p + 1}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {p + 1}
              </Button>
            );
          })}

          {/* Next page */}
          <Button
            variant="ghost"
            rounded="full"
            className="!w-7 !h-7 !p-0 !min-w-[28px] !text-blue-600 hover:!bg-blue-50/50 disabled:!opacity-30 disabled:hover:!bg-transparent disabled:!text-slate-350"
            onClick={() => goToPage(page + 1)}
            disabled={last}
            aria-label="Next page"
            title="Next page"
          >
            <ChevronRight size={14} />
          </Button>

          {/* Last page */}
          <Button
            variant="ghost"
            rounded="full"
            className="!w-7 !h-7 !p-0 !min-w-[28px] !text-blue-600 hover:!bg-blue-50/50 disabled:!opacity-30 disabled:hover:!bg-transparent disabled:!text-slate-350"
            onClick={() => goToPage(totalPages - 1)}
            disabled={last}
            aria-label="Last page"
            title="Last page"
          >
            <ChevronsRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
