export interface JsonlReadOptions {
  /**
   * 特定の行が無効なJSON構文であった場合、`SyntaxError`を発生させる代わりに行をスキップします。
   * @default true
   */
  ignoreInvalid?: boolean
  /**
   * スキーマの定義行をスキーマと解釈せずにそのまま出力するようにします。
   * @default false
   */
  ignoreSchema?: boolean
}

export interface JsonlWriteOptions {
  /**
   * 値に循環参照や`BigInt`など、シリアライズできないオブジェクトが含まれている場合、`TypeError`を発生させる代わりにその値をスキップします。
   * @default true
   */
  ignoreInvalid?: boolean
  /**
   * ファイルに既にスキーマが存在するかを捜索する処理を禁止します。また、スキーマを無効にします。
   * @default false
   */
  ignoreSchema?: boolean
  /**
   * ファイルの書き込みモードです。 `'a'` = 追記、`'w'` = 上書き。
   * @default 'a'
   */
  mode?: 'a' | 'w'
}

export interface JsonlSchemaOptions {
  schema?: string[]
}

export type JsonlWriteOptionsWithSchema = JsonlWriteOptions & JsonlSchemaOptions

export interface JsonlWriter {
  write(data: unknown, schemaOptions?: JsonlSchemaOptions): Promise<void>
  writeMany(data: unknown[], schemaOptions?: JsonlSchemaOptions): Promise<void>
  end(): Promise<boolean>
}

export type FileInput<T = any> = {
  path: string
  options: JsonlReadOptions | JsonlWriteOptionsWithSchema | undefined
  readonly infer?: T
}
