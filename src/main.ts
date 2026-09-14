import * as fsSync from 'fs'
import * as fs from 'fs/promises'
import readline from 'readline'
import type { JsonlReadOptions, JsonlWriteOptions } from './types'
import { toFlatMapArray } from './utils'
import { parseSafe, stringifySafe } from './utils/json'

export type * from './types'

export class Jsonl {
  /**
   * JSONLinesファイルを一括で読み込み、JavaScriptオブジェクトの配列として取得します。
   */
  static async read<T = any>(filePath: string, options?: JsonlReadOptions) {
    const rawData = await fs.readFile(filePath, 'utf-8')
    return rawData
      .split(/\r?\n/)
      .flatMap((line) =>
        line.trim() ? toFlatMapArray(parseSafe<T>(line, options)) : [],
      )
  }

  /**
   * JSONLinesファイルを1行ずつ読み込む非同期イテレータを返します。
   */
  static async *readStream<T = any>(
    filePath: string,
    options?: JsonlReadOptions,
  ): AsyncGenerator<T, void, unknown> {
    const stream = fsSync.createReadStream(filePath)
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    })

    try {
      for await (const line of rl) {
        if (!line.trim()) continue
        const parsed = parseSafe<T>(line, options)
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
    options: JsonlWriteOptions = {},
  ) {
    await this.writeMany(filePath, [data], options)
  }

  /**
   * 複数のJavaScriptオブジェクトをJSON文字列に変換し、ファイルに追記します。
   */
  static async writeMany(
    filePath: string,
    data: unknown[],
    options: JsonlWriteOptions = {},
  ) {
    const payload = this._createPayload(data, options)
    if (payload) await fs.appendFile(filePath, payload + '\n')
  }

  /**
   * ファイルに追記する用のストリームオブジェクトを作成します。
   */
  static writeStream(filePath: string, options: JsonlWriteOptions = {}) {
    const stream = fsSync.createWriteStream(filePath, { flags: 'a' })
    const writeMany = async (data: unknown[]) => {
      const payload = this._createPayload(data, options)
      if (!payload) return

      const bufferOK = stream.write(payload + '\n')
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
      write: (data: unknown) => writeMany([data]),
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
    }
  }

  private static _createPayload(data: unknown[], options: JsonlWriteOptions) {
    return data
      .flatMap((item) => toFlatMapArray(stringifySafe(item, options)))
      .join('\n')
  }
}
