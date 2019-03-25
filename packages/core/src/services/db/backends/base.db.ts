export interface DBObject {
  prefix: string | Buffer
  key: string | Buffer | null
  value: any
}

export interface DBOptions {
  [key: string]: any

  namespace: string
  id?: string
}

/**
 * Base interface that database backends need to implement.
 */
export interface BaseDB {
  start(): Promise<void>
  get<T>(
    prefix: string | Buffer,
    key: string | Buffer | null,
    fallback?: T
  ): Promise<T | any | any[]>
  set(
    prefix: string | Buffer,
    key: string | Buffer | null,
    value: any
  ): Promise<void>
  delete(prefix: string | Buffer, key: string | Buffer | null): Promise<void>
  exists(prefix: string | Buffer, key: string | Buffer | null): Promise<boolean>
  findNextKey(
    prefix: string | Buffer,
    key: string | Buffer | null
  ): Promise<{ prefix: Buffer; key: Buffer }>
  bulkPut(objects: DBObject[]): Promise<void>
  push<T>(
    prefix: string | Buffer,
    key: string | Buffer | null,
    value: T | T[]
  ): Promise<void>
}
