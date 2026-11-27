import * as fs from 'node:fs'
import lineReader from 'reverse-line-reader'
import { SCHEMA_INTERVAL } from '../constraints'
import type { InternalJsonlSchema } from '../main'
import { parseSafe } from '../utils/json'

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
  return new Promise<LatestSchemaResult>((resolve, reject) => {
    try {
      const stat = fs.statSync(filePath)
      if (!stat.isFile()) {
        reject(new Error(`Path is not a file: ${filePath}`))
        return
      }
    } catch {
      resolve({ type: 'not-found' })
      return
    }

    let distance = 0
    lineReader
      .eachLine(filePath, (line, last) => {
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
      .then(() => {
        resolve({ type: 'not-found' })
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
