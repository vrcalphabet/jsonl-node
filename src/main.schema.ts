/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fsSync from 'node:fs'
import * as fs from 'node:fs/promises'
import path from 'node:path'
import readline from 'node:readline'
import { type Schema, createPayload, parseJsonlLine } from './lib/jsonl'
import type {
  JsonlReadOptions,
  JsonlSchemaOptions,
  JsonlWriteOptions,
  JsonlWriteOptionsWithSchema,
  JsonlWriter,
} from './types'
import { toFlatMapArray } from './utils/array'

export type * from './types'

// 行がスキーマであることを識別する型。キー名は正直なんでもいい
export type InternalJsonlSchema = {
  '$jsonl-schema': string[]
}

export class Jsonl {
  // 各ファイルの最新のスキーマとその行番号の一覧
  private static schemas = new Map<
    string,
    { distance: number; schema: string[] } | undefined
  >()

  /**
   * JSONLinesファイルを一括で読み込み、JavaScriptオブジェクトの配列として取得します。\
   * **大きなファイルには向いていません。代わりに{@link Jsonl.readStream}を使用してください。**
   */
  static async read<T = any>(filePath: string, options: JsonlReadOptions = {}) {
    const rawData = await fs.readFile(filePath, 'utf-8')

    // readは一行目から逐次実行するので、this.schemasは使えない
    const schema: Schema = { current: undefined }
    // ファイルを各行に対して実行。無効な行はスキップしたいためflatMapを使用した
    return rawData
      .split(/\r?\n/)
      .flatMap((line) => toFlatMapArray(parseJsonlLine<T>(line, schema, options)))
  }

  /**
   * JSONLinesファイルを1行ずつ読み込む非同期イテレータを返します。
   */
  static async *readStream<T = any>(
    filePath: string,
    options: JsonlReadOptions = {},
  ): AsyncGenerator<T, void, unknown> {
    const stream = fsSync.createReadStream(filePath)
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    })

    try {
      const schema: Schema = { current: undefined }
      for await (const line of rl) {
        const parsed = parseJsonlLine<T>(line, schema, options)
        if (parsed !== undefined) yield parsed
      }
    } finally {
      rl.close()
      stream.destroy()
    }
  }

  /**
   * JavaScriptオブジェクトをJSON文字列に変換し、ファイルに追記します。
   */
  static async write(
    filePath: string,
    data: unknown,
    options: JsonlWriteOptionsWithSchema = {},
  ) {
    await this.writeMany(filePath, [data], options)
  }

  /**
   * 複数のJavaScriptオブジェクトをJSON文字列に変換し、ファイルに追記します。
   */
  static async writeMany(
    filePath: string,
    data: unknown[],
    options: JsonlWriteOptionsWithSchema = {},
  ) {
    this._resetCache(filePath, options)

    const payload = await createPayload(filePath, data, options, this.schemas)
    if (options.mode === 'w') {
      await fs.writeFile(filePath, payload)
    } else if (payload) {
      await fs.appendFile(filePath, payload)
    }
  }

  /**
   * ファイルに追記する用のストリームオブジェクトを作成します。
   */
  static writeStream(filePath: string, options: JsonlWriteOptionsWithSchema = {}) {
    this._resetCache(filePath, options)
    const stream = fsSync.createWriteStream(filePath, { flags: options.mode ?? 'a' })

    const writeMany = async (
      data: unknown[],
      schemaOptions?: JsonlSchemaOptions,
    ) => {
      const payload = await createPayload(
        filePath,
        data,
        { ...options, ...schemaOptions },
        this.schemas,
      )
      if (!payload) return

      const bufferOK = stream.write(payload)
      if (bufferOK) return

      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          stream.off('drain', onDrain)
          stream.off('error', onError)
        }

        const onDrain = () => {
          cleanup()
          resolve()
        }

        const onError = (e: Error) => {
          cleanup()
          reject(e)
        }

        stream.on('drain', onDrain)
        stream.on('error', onError)
      })
    }

    return {
      /** データをストリームに書き込みます。バッファが追い付かない場合は、自動的に待機します。 */
      write: (data: unknown, schemaOptions?: JsonlSchemaOptions) =>
        writeMany([data], schemaOptions),
      /** 複数のデータをストリームに書き込みます。バッファが追い付かない場合は、自動的に待機します。 */
      writeMany,
      /** ストリームの書き込みを完了させて、ファイルを閉じます。 */
      end() {
        return new Promise<boolean>((resolve) => {
          if (stream.writableEnded) {
            resolve(true)
            return
          }

          stream.once('finish', () => resolve(true))
          stream.once('error', () => resolve(false))
          stream.end()
        })
      },
    } satisfies JsonlWriter
  }

  /**
   * ファイルの内容を消去します。
   */
  static async clear(filePath: string) {
    const realPath = path.resolve(filePath)
    await fs.truncate(realPath, 0)
    this.schemas.set(realPath, { distance: 0, schema: [] })
  }

  private static _resetCache(filePath: string, options: JsonlWriteOptions) {
    const realPath = path.resolve(filePath)
    if (options.mode === 'w') {
      this.schemas.set(realPath, { distance: 0, schema: [] })
    }
  }
}
