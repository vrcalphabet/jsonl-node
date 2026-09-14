[日本語](README.md) | **English**

<p align="center">
  <img src="https://img.shields.io/npm/v/jsonl-node?style=for-the-badge" alt="npm version" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge">
</p>

<h1 align="center">jsonl-node</h1>

<p align="center">
  <b>A library for working with <a href="http://jsonlines.org/">JSON Lines</a> in Node.js</b>
</p>

---

## Installation

```bash
npm install jsonl-node
```

## Usage

##### Read All

```ts
import { Jsonl } from 'jsonl-node'

const users = await Jsonl.read<User>('./users.jsonl')
console.log('All users:', users)
```

##### Read as a Stream

```ts
import { Jsonl } from 'jsonl-node'

const readStream = Jsonl.readStream<User>('./users.jsonl')
for await (const user of readStream) {
  console.log('User:', user)
}
```

##### Write All at Once

```ts
import { Jsonl } from 'jsonl-node'

await Jsonl.write('./users.jsonl', { id: 1, name: 'Alice', role: 'admin' })
await Jsonl.writeMany('./users.jsonl', [
  { id: 2, name: 'Bob', role: 'user' },
  { id: 3, name: 'Charlie', role: 'user' },
])
```

##### Write as a Stream

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

Reads a JSON Lines file all at once and returns an array of JavaScript objects.

#### `.readStream(filePath: string, options?: JsonlReadOptions)`

Returns an asynchronous iterator that reads a JSON Lines file one line at a time.

#### `.write(filePath: string, data: unknown, options?: JsonlWriteOptions)`

Converts a JavaScript object to a JSON string and appends it to the file.

#### `.writeMany(filePath: string, data: unknown[], options?: JsonlWriteOptions)`

Converts multiple JavaScript objects to JSON strings and appends them to the file.

#### `.writeStream(filePath: string, options?: JsonlWriteOptions)`

Creates a stream object for appending data to a file.

* `write(data: unknown)` Writes data to the stream. Automatically waits when the buffer cannot keep up.
* `writeMany(data: unknown[])` Writes multiple data items to the stream. Automatically waits when the buffer cannot keep up.
* `end()` Completes the stream and closes the file.

## Options

#### `JsonlReadOptions`

```ts
interface JsonlReadOptions {
  ignoreInvalid?: boolean
}
```

`ignoreInvalid` Skips lines containing invalid JSON syntax instead of throwing a `SyntaxError`. The default is `true`.

#### `JsonlWriteOptions`

```ts
interface JsonlWriteOptions {
  ignoreInvalid?: boolean
}
```

`ignoreInvalid` Skips values that contain unserializable objects, such as circular references or `BigInt`, instead of throwing a `TypeError`. The default is `true`.

## Notes

`.read<T>()` and `.readStream<T>()` allow you to specify the type of the parsed values, but this does not guarantee that the values actually conform to that type. If the file being read cannot be trusted, you should validate the parsed data with [Zod](https://zod.dev/) or [ArkType](https://arktype.io/).

## Contributing

Contributions to the project are welcome! Following the guidelines below will help make the contribution process smoother.

### Issues / PRs

When opening an Issue, please specify whether it is a bug report or a feature request.

For PR descriptions, it is helpful to include the purpose, changes made, affected areas, and sample code.

## License

MIT License
