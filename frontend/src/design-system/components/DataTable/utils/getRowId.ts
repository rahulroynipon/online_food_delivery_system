export function getRowId<T>(
  row: T,
  index: number,
  customGetRowId?: (row: T, index: number) => string
): string {
  if (customGetRowId) return customGetRowId(row, index);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const id = (row as any)?.id;
  return id !== undefined && id !== null ? String(id) : String(index);
}
