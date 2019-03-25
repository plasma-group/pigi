/* Internal Imports */
import { jsonify, stringify } from '../../../utils'
import { DBObject, BaseDBProvider } from './base-db.provider'

export class EphemDBProvider implements BaseDBProvider {
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
  public async get<T>(
    prefix: string,
    key: string | null,
    fallback?: T
  ): Promise<T | any | any[]> {
    key = this.createKey(prefix, key)
    const result = this.db.get(key)
    if (!result) {
      if (fallback !== undefined) {
        return fallback
      } else {
        throw new Error('Key not found in database')
      }
    }

    return jsonify(result)
  }

  /**
   * Sets a given key with the value.
   * @param key Key to set.
   * @param value Value to store.
   */
  public async set(
    prefix: string,
    key: string | null,
    value: any
  ): Promise<void> {
    key = this.createKey(prefix, key)
    const stringified = stringify(value)
    this.db.set(key, stringified)
  }

  /**
   * Deletes a given key from storage.
   * @param key Key to delete.
   */
  public async delete(prefix: string, key: string | null): Promise<void> {
    key = this.createKey(prefix, key)
    this.db.delete(key)
  }

  /**
   * Checks if a key exists in storage.
   * @param key Key to check.
   * @returns `true` if the key exists, `false` otherwise.
   */
  public async exists(prefix: string, key: string | null): Promise<boolean> {
    key = this.createKey(prefix, key)
    return this.db.has(key)
  }

  /**
   * Finds the next key after a given key.
   * @param key The key to start searching from.
   * @returns the next key with the same prefix.
   */
  public async findNextKey(
    prefix: string,
    key: string | null
  ): Promise<{ prefix: string; key: string }> {
    key = this.createKey(prefix, key)
    const keys = Array.from(this.db.keys())

    const nextKey = keys
      .filter((k) => {
        return k.startsWith(prefix)
      })
      .sort()
      .find((k) => {
        return k > key
      })

    if (!nextKey) {
      throw new Error('Could not find next key in database.')
    }

    const splitKey = nextKey.split(':', 2)
    return {
      prefix: splitKey[0],
      key: splitKey[1],
    }
  }

  /**
   * Puts a series of objects into the database in bulk.
   * Should be more efficient than simply calling `set` repeatedly.
   * @param objects A series of objects to put into the database.
   */
  public async bulkPut(objects: DBObject[]): Promise<void> {
    for (const object of objects) {
      await this.set(object.prefix, object.key, object.value)
    }
  }

  /**
   * Pushes to an array stored at a key in the database.
   * @param key The key at which the array is stored.
   * @param value Value to add to the array.
   */
  public async push<T>(
    prefix: string,
    key: string | null,
    value: T | T[]
  ): Promise<void> {
    const current = (await this.get(prefix, key, [])) as T[]
    value = Array.isArray(value) ? value : [value]
    current.concat(value)
    await this.set(prefix, key, current)
  }

  private createKey(prefix: string, key: string | null): string {
    return key !== null ? `${prefix}:${key}` : prefix
  }
}
