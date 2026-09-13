export function toFlatMapArray<T>(value: T | undefined): T[] {
  return value !== undefined ? [value] : []
}
