/**
 * Modified from bcoin's bdb (https://github.com/bcoin-org/bdb) (MIT LICENSE).
 * Credit to the original author, Christopher Jeffrey (https://github.com/chjj).
 */

/* External Imports */
import { BigNumber, bufferUtils, getLogger, ONE, ZERO } from '@pigi/core-utils'
import { AbstractOpenOptions, AbstractLevelDOWN } from 'abstract-leveldown'

import MemDown from 'memdown'

/* Internal Imports */
import {
  RangeBucketInterface,
  DBInterface,
  K,
  V,
  Batch,
  IteratorOptions,
  IteratorInterface,
  BucketInterface,
} from '../types'
import { Iterator } from './iterator'
import { Bucket } from './bucket'
import { RangeBucket } from './range-bucket'

const log = getLogger('db')
export const DEFAULT_PREFIX_LENGTH = 3

/**
 * Checks if an error is a NotFoundError.
 * @param err Error to check.
 * @return `true` if the error is a NotFoundError, `false` otherwise.
 */
const isNotFound = (err: any): boolean => {
  if (!err) {
    return false
  }

  return (
    err.notFound ||
    err.type === 'NotFoundError' ||
    /not\s*found/i.test(err.message)
  )
}

/**
 * Basic DBInterface implementation that wraps some underlying store.
 */
export class DB implements DBInterface {
  constructor(
    readonly db: AbstractLevelDOWN,
    readonly prefixLength: number = DEFAULT_PREFIX_LENGTH
  ) {}

  /**
   * Opens the store.
   * @param [options] Database options.
   */
  public async open(options?: AbstractOpenOptions): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        this.db.open(options, (err) => {
          if (err) {
            reject(err)
            log.error(`Error opening DB: ${err.message}, ${err.stack}`)
            return
          }
          resolve()
        })
      })
    } catch (err) {
      throw err
    }
  }

  /**
   * Closes the store.
   */
  public async close(): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        this.db.close((err) => {
          if (err) {
            reject(err)
            log.error(`Error closing DB: ${err.message}, ${err.stack}`)
            return
          }
          resolve()
        })
      })
    } catch (err) {
      throw err
    }
  }

  /**
   * Queries the value at a given key.
   * @param key KeyInterface to query.
   * @returns the value at that key or `null` if the key was not found.
   */
  public async get(key: K): Promise<V> {
    return new Promise<V>((resolve, reject) => {
      this.db.get(key, (err, value) => {
        if (err) {
          if (isNotFound(err)) {
            log.debug(`Key ${key.toString('hex')} not found.`)
            resolve(null)
            return
          }
          reject(err)
          log.error(
            `Error getting key ${key.toString('hex')}: ${err.message}, ${
              err.stack
            }`
          )
          return
        }
        resolve(value)
      })
    })
  }

  /**
   * Sets the value at a given key.
   * @param key KeyInterface to set.
   * @param value Value to set to.
   */
  public async put(key: K, value: V): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.put(key, value, (err) => {
        if (err) {
          reject(err)
          log.error(
            `Error putting key / value ${key.toString(
              'hex'
            )} / ${value.toString('hex')}: ${err.message}, ${err.stack}`
          )
          return
        }
        resolve()
      })
    })
  }

  /**
   * Deletes a given key.
   * @param key KeyInterface to delete.
   */
  public async del(key: K): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.del(key, (err) => {
        if (err) {
          reject(err)
          log.error(
            `Error deleting key ${key.toString('hex')}: ${err.message}, ${
              err.stack
            }`
          )
          return
        }
        resolve()
      })
    })
  }

  /**
   * Checks whether a given key is set.
   * @param key KeyInterface to query.
   * @returns `true` if the key is set, `false` otherwise.
   */
  public async has(key: K): Promise<boolean> {
    try {
      await this.get(key)
      return true
    } catch (err) {
      log.error(
        `Error checking key existence: key ${key.toString('hex')}: ${
          err.message
        }, ${err.stack}`
      )
      return false
    }
  }

  /**
   * Performs a series of operations in batch.
   * @param operations Operations to perform.
   */
  public async batch(operations: Batch[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.batch(operations, (err) => {
        if (err) {
          reject(err)
          log.error(
            `Error executing batch operation: ${err.message}, ${err.stack}`
          )
          return
        }
        resolve()
      })
    })
  }

  /**
   * Creates an iterator with some options.
   * @param options Parameters for the iterator.
   * @returns the iterator instance.
   */
  public iterator(options?: IteratorOptions): IteratorInterface {
    return new Iterator(this, options)
  }

  /**
   * Creates a prefixed bucket underneath
   * this bucket.
   * @param prefix Prefix to use for the bucket.
   * @returns the bucket instance.
   */
  public bucket(prefix: Buffer): BucketInterface {
    return new Bucket(this, bufferUtils.padLeft(prefix, this.prefixLength))
  }

  /**
   * Creates a prefixed bucket underneath
   * this bucket.
   * @param prefix Prefix to use for the bucket.
   * @returns the bucket instance.
   */
  public rangeBucket(prefix: Buffer): RangeBucketInterface {
    return new RangeBucket(
      this,
      bufferUtils.padLeft(prefix, this.prefixLength)
    )
  }
}

let memId: BigNumber = ZERO
export const newInMemoryDB = (prefixLength: number = 256, options?: {}): DBInterface => {
  memId = memId.add(ONE)
  return new DB(
    new MemDown(`newInMemoryDB/${memId.toString()}`) as any,
    prefixLength
  )
}
