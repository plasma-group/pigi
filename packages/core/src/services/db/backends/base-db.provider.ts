export interface DBObject {
  prefix: string
  key: string | null
  value: any
}

export interface DBOptions {
  [key: string]: any

  namespace: string
  id?: string
}

export interface BaseDBProvider {
  start(): Promise<void>
  get<T>(
    prefix: string,
    key: string | null,
    fallback?: T
  ): Promise<T | any | any[]>
  set(prefix: string, key: string | null, value: any): Promise<void>
  delete(prefix: string, key: string | null): Promise<void>
  exists(prefix: string, key: string | null): Promise<boolean>
  findNextKey(
    prefix: string,
    key: string | null
  ): Promise<{ prefix: string; key: string }>
  bulkPut(objects: DBObject[]): Promise<void>
  push<T>(prefix: string, key: string | null, value: T | T[]): Promise<void>
}
