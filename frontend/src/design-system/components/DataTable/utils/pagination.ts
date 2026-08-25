export function applyPagination<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = page * pageSize;
  const end = start + pageSize;
  return rows.slice(start, end);
}
