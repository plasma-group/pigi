export type DBValue = string | object | number | boolean

export type DBResult = DBValue | DBValue[]

export interface DBObject {
  key: Buffer | string
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

export interface DBIterator {
  iterator: any
  next(): Promise<any>
  end(): Promise<void>
}

export interface BaseDBProvider {
  start(): Promise<void>
  get<T>(key: Buffer | string, fallback?: T): Promise<T | DBResult>
  put(key: Buffer | string, value: DBValue): Promise<void>
  del(key: Buffer | string): Promise<void>
  exists(key: Buffer | string): Promise<boolean>
  iterator(options: object): Promise<DBIterator>
  seek(key: Buffer | string): Promise<string>
  batch(objects: DBOperation[]): Promise<void>
}
