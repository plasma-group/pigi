export type DBValue = string | object | number | boolean

export type DBResult = DBValue | DBValue[]

export interface DBObject {
  key: string
  value: DBValue
}

export interface DBOperation {
  type: string
  key: string
  value: DBValue
}

export interface DBOptions {
  [key: string]: any

  namespace: string
  id?: string
}

export interface BaseDBProvider {
  start(): Promise<void>
  get<T>(key: string, fallback?: T): Promise<T | DBResult>
  put(key: string, value: DBValue): Promise<void>
  del(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  seek(key: string): Promise<string>
  batch(objects: DBObject[]): Promise<void>
}
