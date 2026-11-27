export function isPlainObject(
  value: unknown,
): value is Record<string | number | symbol, unknown> {
  if (typeof value !== 'object' || value === null) return false
  const proto = Object.getPrototypeOf(value)
  return proto === null || proto === Object.prototype
}

export function mapObject<O extends Record<string, any>, T>(
  obj: O,
  callback: (value: O[keyof O], key: keyof O) => T,
): { [K in keyof O]: T } {
  const entries = Object.entries(obj).map(([key, value]) => {
    return [key, callback(value, key)]
  })
  return Object.fromEntries(entries)
}

export function eachObject<K extends string, V>(
  obj: Record<K, V>,
  callback: (value: V, key: K) => void,
) {
  const entries = Object.entries(obj) as [K, V][]
  entries.forEach(([key, value]) => callback(value, key))
}
