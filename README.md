**日本語** | [English](README.en.md)

<p align="center">
  <img src="https://img.shields.io/npm/v/jsonl-node?style=for-the-badge" alt="npm version" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge">
</p>

<h1 align="center">jsonl-node</h1>

<p align="center">
  <b>Node.jsで非同期に <a href="http://jsonlines.org/">JSONLines</a> を扱うためのライブラリ</b>
</p>

---

## インストール

```bash
npm install jsonl-node
```

## 使用例

##### 一括読み込み

```ts
import { Jsonl } from 'jsonl-node'

const users = await Jsonl.read<User>('./users.jsonl')
console.log('All users:', users)
```

##### ストリーム読み込み

```ts
import { Jsonl } from 'jsonl-node'

const readStream = Jsonl.readStream<User>('./users.jsonl')
for await (const user of readStream) {
  console.log('User:', user)
}
```

##### 集約ストリーム読み込み

```ts
import { Jsonl } from 'jsonl-node'
                                // ↓
const readStream = Jsonl.readStreams('data', {
  users: Jsonl.file<User>('./users.jsonl'),
  carts: Jsonl.file<Cart>('./cart.jsonl'),
})

for await (const cart of readStream.carts) {
  console.log('Cart: ', cart)
}
```

##### 一括書き込み

```ts
import { Jsonl } from 'jsonl-node'

await Jsonl.write('./users.jsonl', { id: 1, name: 'Alice', role: 'admin' })
await Jsonl.writeMany('./users.jsonl', [
  { id: 2, name: 'Bob', role: 'user' },
  { id: 3, name: 'Charlie', role: 'user' },
])
```

##### ストリーム書き込み

```ts
import { Jsonl } from 'jsonl-node'

const writeStream = Jsonl.writeStream('./users.jsonl')

await writeStream.write({ id: 1, name: 'Alice', role: 'admin' })
await writeStream.writeMany([
  { id: 2, name: 'Bob', role: 'user' },
  { id: 3, name: 'Charlie', role: 'user' },
])

const success = await writeStream.end()
console.log('Stream closed: ', success)
```

##### 集約ストリーム書き込み

```ts
import { Jsonl } from 'jsonl-node'
                                  // ↓
const writeStream = Jsonl.writeStreams('data', {
  users: Jsonl.file<User>('./users.jsonl'),
  carts: Jsonl.file<Cart>('./cart.jsonl'),
})

await writeStream.users.write({ id: 1, name: 'Alice', role: 'admin' })
await writeStream.carts.write({ id: 1, items: ['Apple', 'Banana'] })

await writeStream.$$end()
```

##### 一括書き込み（スキーマ付き）

```ts
import { Jsonl } from 'jsonl-node'

const options = { schema: ['id', 'name', 'role'] }

await Jsonl.write('./users.jsonl', { id: 1, name: 'Alice', role: 'admin' }, options)
await Jsonl.writeMany('./users.jsonl', [
  { id: 2, name: 'Bob', role: 'user' },
  { id: 3, name: 'Charlie', role: 'user' },
], options)
```

##### ストリーム書き込み（スキーマ付き）

```ts
import { Jsonl } from 'jsonl-node'

const options = { schema: ['id', 'name', 'role'] }
const writeStream = Jsonl.writeStream('./users.jsonl', options)

await writeStream.write({ id: 1, name: 'Alice', role: 'admin' })
await writeStream.writeMany([
  { id: 2, name: 'Bob', role: 'user' },
  { id: 3, name: 'Charlie', role: 'user' },
])

const success = await writeStream.end()
console.log('Stream closed: ', success)
```

---

```ts
interface User {
  id: number
  name: string
  role: string
}
```

## スキーマ

jsonl-node v2.0.0 より、スキーマ構文に対応しました。

スキーマは独自の構文で**他のJSONLライブラリとの互換性はない**ですが、同じ構造のデータを大量に保存する場合、各データに含まれるキーを省略できるためファイルサイズを削減できます。

現時点 (v2.x.x) では、一次元のオブジェクト構造体にのみ対応しています。ネストされたオブジェクトは、2層目から圧縮されなくなります。

```ts
{ id: 1, tags: ['manager', 'dev'] }
// -> [1, ['manager', 'dev']]

{ id: 1, details: { created_at: '2022-09-11' } }
// -> [1, { "created_at": "2022-09-11" }]
```

例えば、以下のように同じ構造のデータを通常のJSONLとして保存すると、各行でキーを繰り返し保存する必要があります。

```json
{ "id": 1, "name": "田中 太郎", "role": "admin", "active": true }
{ "id": 2, "name": "佐藤 花子", "role": "user", "active": true }
{ "id": 3, "name": "鈴木 一郎", "role": "user", "active": false }
{ "id": 4, "name": "高橋 健太", "role": "guest", "active": true }
```

jsonl-nodeのスキーマを使用すると、最初にキーの一覧をスキーマとして定義し、各データではキーを省略して値のみを保存できます。

```json
{ "$jsonl-schema": ["id", "name", "role", "active"] }
[1, "田中 太郎", "admin", true]
[2, "佐藤 花子", "user", true]
[3, "鈴木 一郎", "user", false]
[4, "高橋 健太", "guest", true]
```

読み込み時にはスキーマが自動的に適用され、通常のJSONオブジェクトとしてデータを取得できます。

## API

#### `.read<T>(filePath: string, options?: JsonlReadOptions)`

JSONLinesファイルを一括で読み込み、JavaScriptオブジェクトの配列として取得します。

#### `.readStream<T>(filePath: string, options?: JsonlReadOptions)`

JSONLinesファイルを1行ずつ読み込む非同期イテレータを返します。

#### `.readStreams(basePath: string, filePaths: Record<string, FileInput<T>>, options?: JsonlReadOptions)`

複数のJSONLinesファイルを扱います。basePathには共通ディレクトリを指定します。

#### `.write(filePath: string, data: unknown, options?: JsonlWriteOptionsWithSchema)`

JavaScriptオブジェクトをJSON文字列に変換し、ファイルに追記します。

#### `.writeMany(filePath: string, data: unknown[], options?: JsonlWriteOptionsWithSchema)`

複数のJavaScriptオブジェクトをJSON文字列に変換し、ファイルに追記します。

#### `.writeStream(filePath: string, options?: JsonlWriteOptionsWithSchema)`

ファイルに追記するためのストリームオブジェクトを作成します。

- `write(data: unknown, options?: JsonlSchemaOptions)` データをストリームに書き込みます。バッファが追い付かない場合は、自動的に待機します。
- `writeMany(data: unknown[], options?: JsonlSchemaOptions)` 複数のデータをストリームに書き込みます。バッファが追い付かない場合は、自動的に待機します。
- `end()` ストリームの書き込みを完了させて、ファイルを閉じます。

#### `.writeStreams(basePath: string, filePaths: Record<string, FileInput>, options?: JsonlWriteOptionsWithSchema)`

複数のJSONLinesファイルを扱います。basePathには共通ディレクトリを指定します。

- `$$write(data: unknown, options?: JsonlSchemaOptions)` 複数のJSONLinesファイルにデータを書き込みます。
- `$$writeMany(data: unknown[], options?: JsonlSchemaOptions)` 複数のJSONLinesファイルに複数のデータを書き込みます。
- `$$end()` 複数のJSONLinesファイルのストリームの書き込みを完了させて、ファイルを閉じます。

#### `.clear(filePath: string)`

ファイルの内容を消去します。

#### `.file<T>(filePath: string, options?: JsonlReadOptions | JsonlWriteOptionsWithSchema)`

ファイルに型やオプションを持たせるためのユーティリティメソッドです。 `.readStreams` や `.writeStreams` で使用します。

## オプション

#### `JsonlReadOptions`

```ts
interface JsonlReadOptions {
  ignoreInvalid?: boolean
  ignoreSchema?: boolean
}
```

`ignoreInvalid` 特定の行が無効なJSON構文であった場合、`SyntaxError`を発生させる代わりに行をスキップします。デフォルトは`true`です。

`ignoreSchema` スキーマの定義行をスキーマと解釈せずにそのまま出力するようにします。デフォルトは `false` です。

#### `JsonlWriteOptions`

```ts
interface JsonlWriteOptions {
  ignoreInvalid?: boolean
  ignoreSchema?: boolean
  mode?: 'a' | 'w'
}
```

`ignoreInvalid` 値に循環参照や`BigInt`など、シリアライズできないオブジェクトが含まれている場合、`TypeError`を発生させる代わりにその値をスキップします。デフォルトは`true`です。

`ignoreSchema` ファイルに既にスキーマが存在するかを捜索する処理を禁止します。デフォルトは `false` です。

`mode` `'a'`の場合、ファイルの内容に追記します。`'w'`の場合、ファイルの内容を消去したうえで、新しく書き込みます。

#### `JsonlSchemaOptions`

```ts
type JsonlSchemaOptions = {
  schema?: string[]
}
```

`schema` スキーマを定義する場合に使用します。親（`writeStream`）でスキーマが定義されていた場合、そのスキーマを上書きします。スキーマと書き込むデータの構造が違う場合でも、エラーは出しません。

#### `JsonlWriteOptionsWithSchema`

```ts
type JsonlWriteOptionsWithSchema = JsonlWriteOptions & JsonlSchemaOptions
```

## 注意点

`.read<T>()`, `.readStream<T>()`などにはパース後の値の型を指定できますが、値がその型に従っていることを保証しているわけではありません。取得するファイルが信頼できない場合は、取得した後に[Zod](https://zod.dev/)や[ArkType](https://arktype.io/)で検証する必要があります。

## 貢献

プロジェクトへの貢献を歓迎します！以下のルールに従うと，あなたの貢献がスムーズになります！

### Issue / PR

Issueを立てる際は，バグ報告・機能要望のどちらかを明記してください。
PRの説明には，目的・変更点・影響範囲・サンプルコードがあるとありがたいです。

## ライセンス

MIT License
