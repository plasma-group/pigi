/* Internal Imports */
import {
  BlockManager,
  BlockDB,
  CommitmentContract,
  StateUpdate,
} from '../../interfaces'

/**
 * Simple BlockManager implementation.
 */
export class DefaultBlockManager implements BlockManager {
  /**
   * Initializes the manager.
   * @param blockdb BlockDB instance to store/query data from.
   * @param commitmentContract Contract wrapper used to publish block roots.
   */
  constructor(
    private blockdb: BlockDB,
    private commitmentContract: CommitmentContract
  ) {}

  /**
   * @returns the next plasma block number.
   */
  public async getNextBlockNumber(): Promise<number> {
    return this.blockdb.getNextBlockNumber()
  }

  /**
   * Adds a state update to the list of updates to be published in the next
   * plasma block.
   * @param stateUpdate State update to add to the next block.
   * @returns a promise that resolves once the update has been added.
   */
  public async addPendingStateUpdate(stateUpdate: StateUpdate): Promise<void> {
    await this.blockdb.addPendingStateUpdate(stateUpdate)
  }

  /**
   * @returns the state updates to be published in the next block.
   */
  public async getPendingStateUpdates(): Promise<StateUpdate[]> {
    return this.blockdb.getPendingStateUpdates()
  }

  /**
   * Finalizes the next block and submits the block root to Ethereum.
   * @returns a promise that resolves once the block has been published.
   */
  public async submitNextBlock(): Promise<void> {
    const blockNumber = await this.getNextBlockNumber()
    await this.blockdb.finalizeNextBlock()
    const root = await this.blockdb.getMerkleRoot(blockNumber)
    await this.commitmentContract.submitBlock(root)
  }
}
