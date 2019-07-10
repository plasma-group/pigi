/* External Imports */
import BigNum = require('bn.js')
import { Mutex, MutexInterface } from 'async-mutex'

import { BaseKey, BaseRangeBucket } from '../db'
import { BlockDB } from '../../types/block-production'
import { KeyValueStore, RangeStore } from '../../types/db'
import { StateUpdate } from '../../types/serialization'
import { MAX_BIG_NUM, ONE, ZERO } from '../utils'
import { GenericMerkleIntervalTree } from './merkle-interval-tree'

const PREFIXES = {
  VARS: new BaseKey('v').encode(),
  BLOCKS: new BaseKey('b').encode(),
}

const KEYS = {
  NEXT_BLOCK: Buffer.from('nextblock'),
  BLOCK: new BaseKey('b', ['uint32']),
}

/**
 * Simple BlockDB implementation.
 */
export class DefaultBlockDB implements BlockDB {
  private readonly blockMutex: Mutex
  private vars: KeyValueStore
  private blocks: KeyValueStore

  /**
   * Initializes the database wrapper.
   * @param db Database to store values in.
   */
  constructor(private db: KeyValueStore) {
    this.vars = this.db.bucket(PREFIXES.VARS)
    this.blocks = this.db.bucket(PREFIXES.BLOCKS)
    this.blockMutex = new Mutex()
  }

  /**
   * @returns the next plasma block number.
   */
  public async getNextBlockNumber(): Promise<BigNum> {
    // NOTE: You could theoretically cache the next block number as to avoid
    // having to read from the database repeatedly. However, this introduces
    // the need to ensure that the cached value and stored value never fall out
    // of sync. It's probably better to hold off on implementing caching until
    // this becomes a performance bottleneck.

    const buf = await this.vars.get(KEYS.NEXT_BLOCK)
    // TODO: Node 12 has Buffer.readBigInt64BE(...) -- upgrade?
    return new BigNum(buf.readUInt32BE(0))
  }

  /**
   * Adds a state update to the list of updates to be published in the next
   * plasma block.
   * @param stateUpdate State update to publish in the next block.
   * @returns a promise that resolves once the update has been added.
   */
  public async addPendingStateUpdate(stateUpdate: StateUpdate): Promise<void> {
    await this.blockMutex.runExclusive(async () => {
      const block = await this.getNextBlockStore()
      const start = stateUpdate.range.start
      const end = stateUpdate.range.end

      if (await block.hasDataInRange(start, end)) {
        throw new Error(
          'Block already contains a state update over that range.'
        )
      }

      const value = Buffer.from(JSON.stringify(stateUpdate))
      await block.put(start, end, value)
    })
  }

  /**
   * @returns the list of state updates waiting to be published in the next
   * plasma block.
   */
  public async getPendingStateUpdates(): Promise<StateUpdate[]> {
    const blockNumber = await this.getNextBlockNumber()
    return this.getStateUpdates(blockNumber)
  }

  /**
   * Computes the Merkle Interval Tree root of a given block.
   * @param blockNumber Block to compute a root for.
   * @returns the root of the block.
   */
  public async getMerkleRoot(blockNumber: BigNum): Promise<Buffer> {
    const stateUpdates = await this.getStateUpdates(blockNumber)

    const leaves = stateUpdates.map((stateUpdate) => {
      // TODO: Actually encode this.
      const encodedStateUpdate = JSON.stringify(stateUpdate)
      return {
        start: stateUpdate.range.start,
        end: stateUpdate.range.end,
        data: encodedStateUpdate,
      }
    })
    const tree = new GenericMerkleIntervalTree(leaves)
    return tree.root().hash
  }

  /**
   * Finalizes the next plasma block so that it can be published.
   */
  public async finalizeNextBlock(): Promise<void> {
    await this.blockMutex.runExclusive(async () => {
      const prevBlockNumber = await this.getNextBlockNumber()
      const nextBlockNumber = Buffer.allocUnsafe(4)

      nextBlockNumber.writeUInt32BE(prevBlockNumber.add(ONE).toNumber(), 0)
      await this.vars.put(KEYS.NEXT_BLOCK, nextBlockNumber)
    })
  }

  /**
   * Opens the RangeDB for a specific block.
   * @param blockNumber Block to open the RangeDB for.
   * @returns the RangeDB instance for the given block.
   */
  private async getBlockStore(blockNumber: BigNum): Promise<RangeStore> {
    const key = KEYS.BLOCK.encode([blockNumber])
    const bucket = this.blocks.bucket(key)
    return new BaseRangeBucket(bucket.db, bucket.prefix)
  }

  /**
   * @returns the RangeDB instance for the next block to be published.
   *
   * IMPORTANT: This function itself is safe from concurrency issues, but
   * if the caller is modifying the returned RangeStore or needs to
   * guarantee the returned next RangeStore is not stale, both the call
   * to this function AND any subsequent reads / writes should be run with
   * the blockMutex lock held to guarantee the expected behavior.
   */
  private async getNextBlockStore(): Promise<RangeStore> {
    const blockNumber = await this.getNextBlockNumber()
    return this.getBlockStore(blockNumber)
  }

  /**
   * Queries all of the state updates within a given block.
   * @param blockNumber Block to query state updates for.
   * @returns the list of state updates for that block.
   */
  private async getStateUpdates(blockNumber: BigNum): Promise<StateUpdate[]> {
    const block = await this.getBlockStore(blockNumber)
    const values = await block.get(ZERO, MAX_BIG_NUM)
    return values.map((value) => {
      return JSON.parse(value.toString())
    })
  }
}
