[日本語](README.md) | **English**

<p align="center">
  <img src="https://img.shields.io/npm/v/jsonl-node?style=for-the-badge" alt="npm version" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge">
</p>

<h1 align="center">jsonl-node<font size="2" color="grey">(with schema!)</font></h1>

<p align="center">
  <b>An asynchronous <a href="http://jsonlines.org/">JSONLines</a> library for Node.js</b>
</p>

---

## Installation

```bash
npm install jsonl-node
```

## Usage

##### Read all

```ts
import { Jsonl } from 'jsonl-node'

const users = await Jsonl.read<User>('./users.jsonl')
console.log('All users:', users)
```

##### Stream reading

```ts
import { Jsonl } from 'jsonl-node'

const readStream = Jsonl.readStream<User>('./users.jsonl')
for await (const user of readStream) {
  console.log('User:', user)
}
```

##### Write all at once

```ts
import { Jsonl } from 'jsonl-node'

await Jsonl.write('./users.jsonl', { id: 1, name: 'Alice', role: 'admin' })
await Jsonl.writeMany('./users.jsonl', [
  { id: 2, name: 'Bob', role: 'user' },
  { id: 3, name: 'Charlie', role: 'user' },
])
```

##### Stream writing

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

##### Write all at once (with schema)

```ts
import { Jsonl } from 'jsonl-node/schema' // <- !!

const options = { schema: ['id', 'name', 'role'] }

await Jsonl.write('./users.jsonl', { id: 1, name: 'Alice', role: 'admin' }, options)
await Jsonl.writeMany('./users.jsonl', [
  { id: 2, name: 'Bob', role: 'user' },
  { id: 3, name: 'Charlie', role: 'user' },
], options)
```

##### Stream writing (with schema)

```ts
import { Jsonl } from 'jsonl-node/schema' // <- !!

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

## Schema

Starting with jsonl-node v2.0.0, schema syntax is supported.

The schema uses a custom syntax and is **not compatible with other JSONL libraries**. However, when storing a large amount of data with the same structure, it can reduce file size by omitting the keys from each data entry.

As of v2.0.0, only one-dimensional object structures are supported. Nested objects are no longer compressed starting from the second level.

```ts
{ id: 1, tags: ['manager', 'dev'] }
// -> [1, ['manager', 'dev']]

{ id: 1, details: { created_at: '2022-09-11' } }
// -> [1, { "created_at": "2022-09-11" }]
```


When working with JSONL files that use a schema, you must use `'jsonl-node/schema'` instead of `'jsonl-node'`. This also applies when reading.

```ts
import { Jsonl } from 'jsonl-node/schema'
```

For example, when storing data with the same structure as regular JSONL, the keys must be repeated on every line.

```json
{ "id": 1, "name": "田中 太郎", "role": "admin", "active": true }
{ "id": 2, "name": "佐藤 花子", "role": "user", "active": true }
{ "id": 3, "name": "鈴木 一郎", "role": "user", "active": false }
{ "id": 4, "name": "高橋 健太", "role": "guest", "active": true }
```

With jsonl-node's schema, you can first define the list of keys as a schema and then store only the values for each data entry.

```json
{ "$jsonl-schema": ["id", "name", "role", "active"] }
[1, "田中 太郎", "admin", true]
[2, "佐藤 花子", "user", true]
[3, "鈴木 一郎", "user", false]
[4, "高橋 健太", "guest", true]
```

When reading the file, the schema is automatically applied, allowing you to retrieve the data as regular JSON objects.

The schema API is described below.

## API <font size="5">(`'jsonl-node'`)</font>

#### `.read(filePath: string, options: JsonlReadOptions)`

Reads a JSONLines file at once and returns an array of JavaScript objects.

#### `.readStream(filePath: string, options?: JsonlReadOptions)`

Returns an async iterator that reads the JSONLines file line by line.

#### `.write(filePath: string, data: unknown, options?: JsonlWriteOptions)`

Converts a JavaScript object to a JSON string and appends it to the file.

#### `.writeMany(filePath: string, data: unknown[], options?: JsonlWriteOptions)`

Converts multiple JavaScript objects to JSON strings and appends them to the file.

#### `.writeStream(filePath: string, options?: JsonlWriteOptions)`

Creates a stream object for appending data to the file.

* `write(data: unknown)` Writes data to the stream. Automatically waits when the buffer cannot keep up.
* `writeMany(data: unknown[])` Writes multiple data entries to the stream. Automatically waits when the buffer cannot keep up.
* `end()` Completes the stream and closes the file.

#### `.clear(filePath: string)`

Clears the contents of the file.

### Schema API (`'jsonl-node/schema'`)

#### `.read(filePath: string, options: JsonlReadOptions)`

#### `.readStream(filePath: string, options?: JsonlReadOptions)`

Same as the APIs described above.

#### `.write(filePath: string, data: unknown, options?: JsonlWriteOptionsWithSchema)`

Converts a JavaScript object to a JSON string and appends it to the file.

#### `.writeMany(filePath: string, data: unknown[], options?: JsonlWriteOptionsWithSchema)`

Converts multiple JavaScript objects to JSON strings and appends them to the file.

#### `.writeStream(filePath: string, options?: JsonlWriteOptionsWithSchema)`

Creates a stream object for appending data to the file.

* `write(data: unknown, options?: JsonlSchemaOptions)` Writes data to the stream. Automatically waits when the buffer cannot keep up.
* `writeMany(data: unknown[], options?: JsonlSchemaOptions)` Writes multiple data entries to the stream. Automatically waits when the buffer cannot keep up.
* `end()` Completes the stream and closes the file.

#### `.clear(filePath: string)`

Same as the API described above.

## Options

#### `JsonlReadOptions`

```ts
interface JsonlReadOptions {
  ignoreInvalid?: boolean
}
```

`ignoreInvalid` Skips a line instead of throwing a `SyntaxError` when the line contains invalid JSON syntax. Defaults to `true`.

#### `JsonlWriteOptions`

```ts
interface JsonlWriteOptions {
  ignoreInvalid?: boolean
  mode?: 'a' | 'w'
}
```

`ignoreInvalid` Skips a value instead of throwing a `TypeError` when the value contains an object that cannot be serialized, such as a circular reference or `BigInt`. Defaults to `true`.

`mode` When set to `'a'`, appends to the existing file contents. When set to `'w'`, clears the file contents before writing new data.

#### `JsonlSchemaOptions`

```ts
type JsonlSchemaOptions = {
  schema?: string[]
}
```

`schema` Used to define a schema. If a schema is defined on the parent (`writeStream`), this schema overrides it. No error is thrown even if the schema does not match the structure of the data being written.

#### `JsonlWriteOptionsWithSchema`

```ts
type JsonlWriteOptionsWithSchema = JsonlWriteOptions & JsonlSchemaOptions
```

## Notes

`.read<T>()` and `.readStream<T>()` allow you to specify the type of the parsed values, but they do not guarantee that the values actually conform to that type. If the file being read is untrusted, you should validate the retrieved data using [Zod](https://zod.dev/) or [ArkType](https://arktype.io/).

## Contributing

Contributions to the project are welcome! Following the guidelines below will help make the contribution process smoother.

### Issues / PRs

When creating an issue, please specify whether it is a bug report or a feature request.

For PR descriptions, it would be helpful to include the purpose, changes, scope of impact, and sample code.

## License

MIT License
