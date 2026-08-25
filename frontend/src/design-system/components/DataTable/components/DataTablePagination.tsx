import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useDataTable } from '../core/useDataTable';
import { usePagination } from '../core/usePagination';
import { Select } from '../../Select';
import { cn } from '@/lib/utils';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function DataTablePagination() {
  const { isMobile } = useDataTable<any>();
  const {
    page,
    pageSize,
    totalRows,
    totalPages,
    goToPage,
    setPageSize,
    nextPage,
    prevPage,
    canNextPage,
    canPrevPage,
  } = usePagination();

  const from = totalRows === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalRows);

  const getPageNumbers = (): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
    if (page <= 3) {
      for (let i = 0; i <= 4; i++) pages.push(i);
      pages.push('ellipsis-end');
      pages.push(totalPages - 1);
    } else if (page >= totalPages - 4) {
      pages.push(0);
      pages.push('ellipsis-start');
      for (let i = totalPages - 5; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      pages.push('ellipsis-start');
      pages.push(page - 1);
      pages.push(page);
      pages.push(page + 1);
      pages.push('ellipsis-end');
      pages.push(totalPages - 1);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const navBtn = [
    'w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded-full',
    'border border-slate-200 bg-white sm:border-none sm:bg-transparent text-blue-500',
    'hover:bg-blue-50 active:bg-blue-100/70 transition-all cursor-pointer select-none shadow-sm sm:shadow-none',
    'disabled:opacity-30 disabled:cursor-not-allowed text-sm',
  ].join(' ');

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 w-full select-none text-sm',
        isMobile ? 'bg-transparent border-t-0 mt-4' : 'bg-white border-t border-slate-100'
      )}
    >
      {/* Left: Rows per page */}
      {!isMobile && (
        <div className="flex items-center gap-2">
          <span className="text-slate-500 whitespace-nowrap">Rows per page:</span>
          <Select
            options={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
            value={String(pageSize)}
            onValueChange={(val) => setPageSize(Number(val))}
            size="xs"
            width={80}
            align="start"
            aria-label="Rows per page"
          />
        </div>
      )}

      {/* Right: range + navigation */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Range label */}
        <span className="text-slate-500 whitespace-nowrap mr-3 sm:mr-1">
          {from}–{to} of {totalRows.toLocaleString()}
        </span>

        {isMobile ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => goToPage(0)}
              disabled={page === 0}
              className={navBtn}
              aria-label="First page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={prevPage}
              disabled={!canPrevPage}
              className={navBtn}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-slate-600 font-semibold px-2 whitespace-nowrap text-xs">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={!canNextPage}
              className={navBtn}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => goToPage(totalPages - 1)}
              disabled={page === totalPages - 1}
              className={navBtn}
              aria-label="Last page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        ) : (
          <nav aria-label="Pagination" className="flex items-center gap-0.5">
            {/* First */}
            <button
              onClick={() => goToPage(0)}
              disabled={page === 0}
              className={navBtn}
              aria-label="First page"
            >
              <ChevronsLeft size={14} />
            </button>
            {/* Prev */}
            <button
              onClick={prevPage}
              disabled={!canPrevPage}
              className={navBtn}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Page numbers */}
            {pageNumbers.map((p, idx) => {
              if (p === 'ellipsis-start' || p === 'ellipsis-end') {
                return (
                  <span
                    key={`${p}-${idx}`}
                    className="w-7 h-7 flex items-center justify-center text-blue-400"
                  >
                    …
                  </span>
                );
              }
              const isActive = p === page;
              return isActive ? (
                <span
                  key={p}
                  aria-current="page"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500 text-white font-semibold"
                >
                  {p + 1}
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  aria-label={`Page ${p + 1}`}
                  className="w-7 h-7 flex items-center justify-center rounded-full border-none bg-transparent text-blue-500 hover:bg-blue-50 font-medium transition-colors cursor-pointer"
                >
                  {p + 1}
                </button>
              );
            })}

            {/* Next */}
            <button
              onClick={nextPage}
              disabled={!canNextPage}
              className={navBtn}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
            {/* Last */}
            <button
              onClick={() => goToPage(totalPages - 1)}
              disabled={page === totalPages - 1}
              className={navBtn}
              aria-label="Last page"
            >
              <ChevronsRight size={14} />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
