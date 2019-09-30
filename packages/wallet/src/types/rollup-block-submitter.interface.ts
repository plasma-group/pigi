import { RollupBlock } from './types'

export interface RollupBlockSubmitter {
  /**
   * Performs all initialization required to bootstrap this
   * BlockSubmitter. This will likely entail reading any existing
   * state from a datastore.
   */
  init(): Promise<void>

  /**
   * Submits a block or queues it for later submission.
   * @param block The block to submit
   */
  submitBlock(block: RollupBlock): Promise<void>

  /**
   * Handles the provided block. This is the mechanism by which
   * the BlockSubmitter gets confirmations for pending blocks.
   *
   * @param rollupBlockNumber The number of the new block
   */
  handleNewRollupBlock(rollupBlockNumber: number): Promise<void>
}
