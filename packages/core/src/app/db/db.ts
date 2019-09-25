/**
 * Modified from bcoin's bdb (https://github.com/bcoin-org/bdb) (MIT LICENSE).
 * Credit to the original author, Christopher Jeffrey (https://github.com/chjj).
 */

/* External Imports */
import {
  AbstractOpenOptions,
  AbstractLevelDOWN,
  AbstractChainedBatch,
} from 'abstract-leveldown'

import MemDown from 'memdown'

/* Internal Imports */
import {
  DB,
  K,
  V,
  Batch,
  IteratorOptions,
  Iterator,
  Bucket,
  RangeBucket,
  BigNumber,
  ZERO,
  ONE,
} from '../../types'
import { BaseIterator } from './iterator'
import { BaseBucket } from './bucket'
import { BaseRangeBucket } from './range-bucket'
import { bufferUtils, getLogger } from '../utils'

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
 * Basic DB implementation that wraps some underlying store.
 */
export class BaseDB implements DB {
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
   * @param key Key to query.
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
        log.debug(
          `Key ${key.toString(
            'hex'
          )} fetched. Returning value [${value.toString('hex')}].`
        )
        resolve(value)
      })
    })
  }

  /**
   * Sets the value at a given key.
   * @param key Key to set.
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
        log.debug(
          `Put key / value [${key.toString('hex')} / ${value.toString('hex')}]`
        )
        resolve()
      })
    })
  }

  /**
   * Deletes a given key.
   * @param key Key to delete.
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
   * @param key Key to query.
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
  public iterator(options?: IteratorOptions): Iterator {
    return new BaseIterator(this, options)
  }

  /**
   * Creates a prefixed bucket underneath
   * this bucket.
   * @param prefix Prefix to use for the bucket.
   * @returns the bucket instance.
   */
  public bucket(prefix: Buffer): Bucket {
    return new BaseBucket(this, bufferUtils.padLeft(prefix, this.prefixLength))
  }

  /**
   * Creates a prefixed bucket underneath
   * this bucket.
   * @param prefix Prefix to use for the bucket.
   * @returns the bucket instance.
   */
  public rangeBucket(prefix: Buffer): RangeBucket {
    return new BaseRangeBucket(
      this,
      bufferUtils.padLeft(prefix, this.prefixLength)
    )
  }
}

let memId: BigNumber = ZERO
export const newInMemoryDB = (prefixLength: number = 256): DB => {
  memId = memId.add(ONE)
  return new BaseDB(
    new MemDown(`newInMemoryDB/${memId.toString()}`) as any,
    prefixLength
  )
}
