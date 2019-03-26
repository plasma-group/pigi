/* Internal Imports */
import { jsonify, stringify } from '../../../utils'
import { DBValue, DBOperation, DBObject, DBIterator, DBResult, BaseDBProvider } from './base-db.provider'

/* External Imports */
import levelup = require('levelup')
import leveldown = require('leveldown')

class LevelDBIterator implements DBIterator {
  constructor(
    public iterator: any
  ) {}

  public next(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.iterator.next((err, key, value) => {
        if (err) {
          reject(err)
        }
        resolve({ key, value })
      })
    })
  }

  public end(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.iterator.end((err) => {
        if (err) {
          reject(err)
        }
        resolve()
      })
    })
  }
}

export class LevelDB implements BaseDBProvider {
  private db

  constructor(path: string) {
    this.db = levelup(leveldown(path))
  }

  /**
   * Empty method since it's required.
   */
  public async start(): Promise<void> {
    return
  }

  /**
   * Returns the value stored at the given key.
   * @param key Key to query.
   * @param fallback A fallback value if the key doesn't exist.
   * @returns the stored value or the fallback.
   */
  public async get<T>(key: Buffer | string, fallback?: T): Promise<T | DBResult> {
    const result = await this.db.get(key)
    return result
  }

  /**
   * Sets a given key with the value.
   * @param key Key to set.
   * @param value Value to store.
   */
  public async put(key: Buffer | string, value: DBValue): Promise<void> {
    await this.db.put(key, value)
  }

  /**
   * Deletes a given key from storage.
   * @param key Key to delete.
   */
  public async del(key: Buffer | string): Promise<void> {
    await this.db.del(key)
  }

  /**
   * Checks if a key exists in storage.
   * @param key Key to check.
   * @returns `true` if the key exists, `false` otherwise.
   */
  public async exists(key: Buffer | string): Promise<boolean> {
    try {
      await this.db.get(key)
      return true
    } catch(err) {
      return false
    }
  }

  /**
   * Creates a DB iterator based on the supplied options
   * @param options The key to start searching from.
   * @returns the DB iterator
   */
  public async iterator(options: object): Promise<DBIterator> {
    return new LevelDBIterator(this.db.iterator(options))
  }

  /**
   * Finds the next key after a given key.
   * @param key The key to start searching from.
   * @returns the next key with the same prefix.
   */
  public async seek(key: Buffer | string): Promise<string> {
    return 'NOT IMPLEMENTED'
  }

  /**
   * Puts a series of objects into the database in bulk.
   * Should be more efficient than simply calling `set` repeatedly.
   * @param objects A series of objects to put into the database.
   */
  public async batch(operations: DBOperation[]): Promise<void> {
    await this.db.batch(operations)
  }
}
