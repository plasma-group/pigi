/* External Imports */
import BigNumber = require('bn.js')
import { MerkleIntervalTree } from '@pigi/utils'

/* Internal Imports */
import { BaseKey } from '../common'
import { KeyValueStore, BlockDB, StateUpdate } from '../../interfaces'

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
  private vars: KeyValueStore
  private blocks: KeyValueStore

  /**
   * Initializes the database wrapper.
   * @param db Database to store values in.
   */
  constructor(private db: KeyValueStore) {
    this.vars = this.db.bucket(PREFIXES.VARS)
    this.blocks = this.db.bucket(PREFIXES.BLOCKS)
  }

  /**
   * @returns the next plasma block number.
   */
  public async getNextBlockNumber(): Promise<number> {
    // NOTE: You could theoretically cache the next block number as to avoid
    // having to read from the database repeatedly. However, this introduces
    // the need to ensure that the cached value and stored value never fall out
    // of sync. It's probably better to hold off on implementing caching until
    // this becomes a performance bottleneck.

    const buf = await this.vars.get(KEYS.NEXT_BLOCK)
    return buf.readUInt32BE(0)
  }

  /**
   * Adds a state update to the list of updates to be published in the next
   * plasma block.
   * @param stateUpdate State update to publish in the next block.
   * @returns a promise that resolves once the update has been added.
   */
  public async addPendingStateUpdate(stateUpdate: StateUpdate): Promise<void> {
    const block = await this.getNextBlockStore()
    const start = stateUpdate.id.start
    const end = stateUpdate.id.end

    // TODO: Figure out how to implement locking here so two state updates
    // can't be added at the same time.

    if (await block.has(start, end)) {
      throw new Error('Block already contains a state update over that range.')
    }

    const value = Buffer.from(JSON.stringify(stateUpdate))
    await block.put(start, end, value)
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
  public async getMerkleRoot(blockNumber: number): Promise<string> {
    const stateUpdates = await this.getStateUpdates(blockNumber)

    const leaves = stateUpdates.map((stateUpdate) => {
      const encodedStateUpdate = JSON.stringify(stateUpdate) // TODO: Actually encode this.
      return {
        end: stateUpdate.id.end,
        data: encodedStateUpdate,
      }
    })
    const tree = new MerkleIntervalTree({
      leaves,
    })
    return tree.root
  }

  /**
   * Finalizes the next plasma block so that it can be published.
   * @returns a promise that resolves once the block has been finalized.
   */
  public async finalizeNextBlock(): Promise<void> {
    const prevBlockNumber = await this.getNextBlockNumber()
    const nextBlockNumber = Buffer.allocUnsafe(4)
    nextBlockNumber.writeUInt32BE(prevBlockNumber + 1, 0)
    await this.vars.put(KEYS.NEXT_BLOCK, nextBlockNumber)
  }

  /**
   * Opens the RangeDB for a specific block.
   * @param blockNumber Block to open the RangeDB for.
   * @returns the RangeDB instance for the given block.
   */
  private async getBlockStore(blockNumber: number): Promise<RangeDB> {
    const key = KEYS.BLOCK.encode([blockNumber])
    const bucket = this.blocks.bucket(key)
    return new RangeDB(bucket)
  }

  /**
   * @returns the RangeDB instance for the next block to be published.
   */
  private async getNextBlockStore(): Promise<RangeDB> {
    const blockNumber = await this.getNextBlockNumber()
    return this.getBlockStore(blockNumber)
  }

  /**
   * Queries all of the state updates within a given block.
   * @param blockNumber Block to query state updates for.
   * @returns the list of state updates for that block.
   */
  private async getStateUpdates(blockNumber: number): Promise<StateUpdate[]> {
    const block = await this.getBlockStore(blockNumber)
    const values = await block.get(
      new BigNumber(0),
      new BigNumber('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')
    )
    return values.map((value) => {
      return JSON.parse(value.toString())
    })
  }
}
