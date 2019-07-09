import BigNum = require('bn.js')

import { Aggregator, BlockManager } from '../../types/aggregator'
import { StateManager } from '../../types/ovm'
import { Transaction, TransactionResult } from '../../types/serialization'

export class DefaultAggregator implements Aggregator {
  private readonly stateManager: StateManager
  private readonly blockManager: BlockManager

  public constructor(stateManager: StateManager, blockManager: BlockManager) {
    this.stateManager = stateManager
    this.blockManager = blockManager
  }

  public async ingestTransaction(
    transaction: Transaction,
    witness: string
  ): Promise<void> {
    const blockNum: BigNum = await this.blockManager.getNextBlockNumber()

    const {
      stateUpdate,
    }: TransactionResult = await this.stateManager.executeTransaction(
      transaction,
      blockNum,
      witness
    )

    await this.blockManager.addPendingStateUpdate(stateUpdate)
  }
}
