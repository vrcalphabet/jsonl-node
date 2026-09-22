import lineReader from 'reverse-line-reader'
import { SCHEMA_INTERVAL } from '../constraints'
import { parseSafe } from '../utils/json'
import type { InternalJsonlSchema } from '../main.schema'

type LatestSchemaResult =
  | {
      type: 'found'
      distance: number
      schema: string[]
    }
  | {
      type: 'not-found' | 'limit-reached'
    }

export function getLatestSchema(filePath: string) {
  return new Promise<LatestSchemaResult>((resolve) => {
    let distance = 0

    lineReader.eachLine(filePath, (line, last) => {
      const schema = extractSchema(parseSafe(line))
      if (schema) {
        resolve({ type: 'found', distance, schema })
        return false
      }

      if (last) {
        resolve({ type: 'not-found' })
        return false
      }

      if (++distance >= SCHEMA_INTERVAL) {
        resolve({ type: 'limit-reached' })
        return false
      }
    })
  })
}

export function extractSchema(data: unknown) {
  if (typeof data !== 'object' || !data) return
  if ('$jsonl-schema' in data) return (data as InternalJsonlSchema)['$jsonl-schema']
}

export function jsonlSchema(schema: string[]) {
  return { '$jsonl-schema': schema } satisfies InternalJsonlSchema
}
