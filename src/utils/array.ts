export function toFlatMapArray<T>(value: T | undefined): T[] {
  return value !== undefined ? [value] : []
}

export function equals<T>(left: T[], right: T[]): boolean {
  if (left.length !== right.length) return false
  return left.every((value, i) => value === right[i])
}
