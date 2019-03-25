/* Internal Imports */
import { jsonify, stringify } from '../../../utils'
import { DBObject, BaseDB } from './base.db'

const toBuffer = (value: string | Buffer): Buffer => {
  return Buffer.isBuffer(value) ? value : Buffer.from(value)
}

/**
 * Creates the internal database key given the prefix and the key.
 * @param prefix Prefix for the  key.
 * @param key Database key.
 * @returns the combined key as a buffer.
 */
const createKey = (
  prefix: string | Buffer | Buffer | Buffer,
  key: string | Buffer | null
): Buffer => {
  prefix = toBuffer(prefix)
  return key !== null ? Buffer.concat([prefix, toBuffer(key)]) : prefix
}

export class EphemDB implements BaseDB {
  private db = new Map<Buffer, string>()

  /**
   * Empty method since it's required.
   */
  public async start(): Promise<void> {
    return
  }

  /**
   * Returns the value stored at the given key.
   * @param prefix Prefix for the key.
   * @param key Key to query.
   * @param fallback A fallback value if the key doesn't exist.
   * @returns the stored value or the fallback.
   */
  public async get<T>(
    prefix: string | Buffer,
    key: string | Buffer | null,
    fallback?: T
  ): Promise<T | any | any[]> {
    key = createKey(prefix, key)
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
   * @param prefix Prefix for the key.
   * @param key Key to set.
   * @param value Value to store.
   */
  public async set(
    prefix: string | Buffer,
    key: string | Buffer | null,
    value: any
  ): Promise<void> {
    key = createKey(prefix, key)
    const stringified = stringify(value)
    this.db.set(key, stringified)
  }

  /**
   * Deletes a given key from storage.
   * @param key Key to delete.
   */
  public async delete(
    prefix: string | Buffer,
    key: string | Buffer | null
  ): Promise<void> {
    key = createKey(prefix, key)
    this.db.delete(key)
  }

  /**
   * Checks if a key exists in storage.
   * @param prefix Prefix for the key.
   * @param key Key to check.
   * @returns `true` if the key exists, `false` otherwise.
   */
  public async exists(
    prefix: string | Buffer,
    key: string | Buffer | null
  ): Promise<boolean> {
    key = createKey(prefix, key)
    return this.db.has(key)
  }

  /**
   * Finds the next key after a given key.
   * @param prefix Prefix for the key.
   * @param key The key to start searching from.
   * @returns the next key with the same prefix.
   */
  public async findNextKey(
    prefix: string | Buffer,
    key: string | Buffer | null
  ): Promise<{ prefix: Buffer; key: Buffer }> {
    key = createKey(prefix, key)
    const keys = Array.from(this.db.keys())

    const nextKey = keys
      .filter((k) => {
        return k.indexOf(prefix) === 0
      })
      .sort()
      .find((k) => {
        return k > key
      })

    if (!nextKey) {
      throw new Error('Could not find next key in database.')
    }

    return {
      prefix: nextKey.slice(0, prefix.length),
      key: nextKey.slice(prefix.length),
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
   * @param prefix Prefix for the key.
   * @param key The key at which the array is stored.
   * @param value Value to add to the array.
   */
  public async push<T>(
    prefix: string | Buffer,
    key: string | Buffer | null,
    value: T | T[]
  ): Promise<void> {
    const current = (await this.get(prefix, key, [])) as T[]
    value = Array.isArray(value) ? value : [value]
    current.concat(value)
    await this.set(prefix, key, current)
  }
}
