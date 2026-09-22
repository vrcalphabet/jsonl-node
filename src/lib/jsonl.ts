import path from 'node:path'
import { SCHEMA_INTERVAL } from '../constraints'
import type { JsonlReadOptions, JsonlWriteOptionsWithSchema } from '../types'
import { equals, toFlatMapArray } from '../utils/array'
import { parseSafe, stringifySafe } from '../utils/json'
import { isPlainObject } from '../utils/object'
import { extractSchema, getLatestSchema, jsonlSchema } from './schema'
import type { InternalJsonlSchema, Jsonl } from '../main.schema'

export type Schema = {
  current: string[] | undefined
}

export function parseJsonlLine<T>(
  line: string,
  schema: Schema,
  options: JsonlReadOptions,
) {
  if (!line.trim()) return

  // 行をJSONでパース。無効な場合は行をスキップする（ignoreがtrueの場合）
  const parsed = parseSafe<T | InternalJsonlSchema>(line, options)
  if (parsed === undefined) return

  // 行からスキーマを取得する
  const parsedSchema = extractSchema(parsed)
  if (parsedSchema) {
    schema.current = parsedSchema
    return
  }

  // スキーマがある場合で、行がスキーマの形式（配列）に従っていたら
  if (
    Array.isArray(parsed) &&
    schema.current &&
    schema.current.length === parsed.length
  ) {
    // スキーマの定義に従って組み立てる
    const result = Object.fromEntries(
      schema.current.map((key, i) => [key, parsed[i]]),
    )
    return result as T
  } else {
    // スキーマじゃなかったら普通に返す
    return parsed as T
  }
}

export async function createPayload(
  filePath: string,
  data: unknown[],
  options: JsonlWriteOptionsWithSchema,
  schemas: (typeof Jsonl)['schemas'],
) {
  const realPath = path.resolve(filePath)
  const writeData: unknown[] = []

  let state = schemas.get(realPath)
  if (!schemas.has(realPath)) {
    // またキャッシュされていない場合は、ファイルを逆向きに探索してスキーマを取得する
    const latestSchema = await getLatestSchema(realPath)

    if (latestSchema.type === 'found') {
      // スキーマが見つかった場合は、キャッシュに保存する
      state = latestSchema
    } else if (latestSchema.type === 'limit-reached') {
      // 探索上限に達した場合は、直前までスキーマが存在していた可能性があるため解除を明示する
      if (!options.schema) {
        writeData.push(jsonlSchema([]))
      }
      state = undefined
    } else {
      state = undefined
    }
  }

  if (state) {
    if (equals(state.schema, options.schema ?? [])) {
      // スキーマとキャッシュが同じなら何もしない
      if (state.distance >= SCHEMA_INTERVAL) {
        // 但し、探索の範囲外になるときは同じスキーマで上書きする
        writeData.push(jsonlSchema(state.schema))
        state.distance = 0
      }
    } else {
      // スキーマとキャッシュが違うなら、スキーマを上書きする
      // options.schemaが指定されていないなら、スキーマが解除されたと判定
      writeData.push(jsonlSchema(options.schema ?? []))
      state = options.schema ? { distance: 0, schema: options.schema } : undefined
    }
  } else if (options.schema) {
    // limit-reached || not-foundの場合で、options.schemaが指定されているときはスキーマを定義する
    writeData.push(jsonlSchema(options.schema))
    state = {
      distance: 0,
      schema: options.schema,
    }
  }

  schemas.set(realPath, state)

  writeData.push(...data)
  if (state) state.distance += writeData.length

  const payload = writeData
    .flatMap((item) => {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (isPlainObject(item) && state?.schema.length) {
        if ('$jsonl-schema' in item) return [stringifySafe(item)]
        const data = state.schema.map((key) => item[key])
        return toFlatMapArray(stringifySafe(data, options))
      }
      return toFlatMapArray(stringifySafe(item, options))
    })
    .join('\n')
  return payload ? payload + '\n' : ''
}
