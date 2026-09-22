import type { JsonlReadOptions, JsonlWriteOptionsWithSchema } from '../types'

export function parseSafe<T>(
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
  { ignoreInvalid = true }: JsonlWriteOptionsWithSchema = {},
) {
  try {
    return JSON.stringify(value)
  } catch (e) {
    if (!ignoreInvalid) throw e
    return
  }
}
