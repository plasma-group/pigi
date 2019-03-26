/* Internal Imports */
import { jsonify, stringify } from '../../../utils'
import { DBValue, DBObject, DBResult, BaseDBProvider } from './base-db.provider'

export class LevelDB implements BaseDBProvider {
  private db = new Map<string, string>()

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
  public async get<T>(key: string, fallback?: T): Promise<T | DBResult> {
    return 'NOT IMPLEMENTED'
  }

  /**
   * Sets a given key with the value.
   * @param key Key to set.
   * @param value Value to store.
   */
  public async put(key: string, value: DBValue): Promise<void> {
    // NOT IMPLEMENTED
  }

  /**
   * Deletes a given key from storage.
   * @param key Key to delete.
   */
  public async del(key: string): Promise<void> {
    // NOT IMPLEMENTED
  }

  /**
   * Checks if a key exists in storage.
   * @param key Key to check.
   * @returns `true` if the key exists, `false` otherwise.
   */
  public async exists(key: string): Promise<boolean> {
    return false
  }

  /**
   * Finds the next key after a given key.
   * @param key The key to start searching from.
   * @returns the next key with the same prefix.
   */
  public async seek(key: string): Promise<string> {
    return 'NOT IMPLEMENTED'
  }

  /**
   * Puts a series of objects into the database in bulk.
   * Should be more efficient than simply calling `set` repeatedly.
   * @param objects A series of objects to put into the database.
   */
  public async batch(objects: DBObject[]): Promise<void> {
    // NOT IMPLEMENTED
  }
}
