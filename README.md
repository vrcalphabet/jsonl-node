**日本語** | [English](README.en.md)

<p align="center">
  <img src="https://img.shields.io/npm/v/jsonl-node?style=for-the-badge" alt="npm version" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge">
</p>

<h1 align="center">jsonl-node</h1>

<p align="center">
  <b>Node.jsで<a href="http://jsonlines.org/">JSONLines</a>を扱うためのライブラリ</b>
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

---

```ts
interface User {
  id: number
  name: string
  role: string
}
```

## API

#### `.read(filePath: string, options: JsonlReadOptions)`

JSONLinesファイルを一括で読み込み、JavaScriptオブジェクトの配列として取得します。

#### `.readStream(filePath: string, options?: JsonlReadOptions)`

JSONLinesファイルを1行ずつ読み込む非同期イテレータを返します。

#### `.write(filePath: string, data: unknown, options?: JsonlWriteOptions)`

JavaScriptオブジェクトをJSON文字列に変換し、ファイルに追記します。

#### `.writeMany(filePath: string, data: unknown[], options?: JsonlWriteOptions)`

複数のJavaScriptオブジェクトをJSON文字列に変換し、ファイルに追記します。

#### `.writeStream(filePath: string, options?: JsonlWriteOptions)`

ファイルに追記する用のストリームオブジェクトを作成します。

- `write(data: unknown)` データをストリームに書き込みます。バッファが追い付かない場合は、自動的に待機します。
- `writeMany(data: unknown[])` 複数のデータをストリームに書き込みます。バッファが追い付かない場合は、自動的に待機します。
- `end()` ストリームの書き込みを完了させて、ファイルを閉じます。

## オプション

#### `JsonlReadOptions`

```ts
interface JsonlReadOptions {
  ignoreInvalid?: boolean
}
```

`ignoreInvalid` 特定の行が無効なJSON構文であった場合、`SyntaxError`を発生させる代わりに行をスキップします。デフォルトは`true`です。

#### `JsonlWriteOptions`

```ts
interface JsonlWriteOptions {
  ignoreInvalid?: boolean
}
```

`ignoreInvalid` 値に循環参照や`BigInt`など、シリアライズできないオブジェクトが含まれている場合、`TypeError`を発生させる代わりにその値をスキップします。デフォルトは`true`です。

## 注意点

`.read<T>()`, `.readStream<T>()`にはパース後の値の型を指定できますが、値がその型に従っていることを保証しているわけではありません。取得するファイルが信頼できない場合は、取得した後に[Zod](https://zod.dev/)や[ArkType](https://arktype.io/)で検証する必要があります。

## 貢献

プロジェクトへの貢献を歓迎します！以下のルールに従うと，あなたの貢献がスムーズになります！

### Issue / PR

Issueを立てる際は，バグ報告・機能要望のどちらかを明記してください。
PRの説明には，目的・変更点・影響範囲・サンプルコードがあるとありがたいです。

## ライセンス

MIT License
