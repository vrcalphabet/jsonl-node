export interface JsonlReadOptions {
  /**
   * 特定の行が無効なJSON構文であった場合、`SyntaxError`を発生させる代わりに行をスキップします。
   * @default true
   */
  ignoreInvalid?: boolean
}

export interface JsonlWriteOptions {
  /**
   * 値に循環参照や`BigInt`など、シリアライズできないオブジェクトが含まれている場合、`TypeError`を発生させる代わりにその値をスキップします。
   * @default true
   */
  ignoreInvalid?: boolean
}
