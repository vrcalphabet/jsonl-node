import type { FileInput } from '..'

export type InferFile<T> = T extends FileInput<infer T> ? T : any
