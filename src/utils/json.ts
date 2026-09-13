import type { JsonlReadOptions, JsonlWriteOptions } from '../types'

export function parseSafe<T = any>(
  value: string,
  { ignoreInvalid = true }: JsonlReadOptions = {},
) {
  try {
    return JSON.parse(value) as T
  } catch (e) {
    if (!ignoreInvalid) throw e
    return
  }
}

export function stringifySafe(
  value: unknown,
  { ignoreInvalid = true }: JsonlWriteOptions = {},
) {
  try {
    return JSON.stringify(value)
  } catch (e) {
    if (!ignoreInvalid) throw e
    return
  }
}
