import BigNum = require('bn.js')

import { Aggregator, BlockManager } from '../../types/aggregator'
import { StateManager } from '../../types/ovm'
import {
  BlockTransaction,
  BlockTransactionCommitment,
  Transaction,
  TransactionResult,
} from '../../types/serialization'
import { rangesSpanRange, sign } from '../utils'

export class DefaultAggregator implements Aggregator {
  private readonly publicKey: string =
    'TODO: figure out public key storage and access'
  private readonly privateKey: string =
    'TODO: figure out private key storage and access'
  private readonly stateManager: StateManager
  private readonly blockManager: BlockManager

  public constructor(stateManager: StateManager, blockManager: BlockManager) {
    this.stateManager = stateManager
    this.blockManager = blockManager
  }

  public async ingestTransaction(
    transaction: Transaction,
    witness: string
  ): Promise<BlockTransactionCommitment> {
    const blockNumber: BigNum = await this.blockManager.getNextBlockNumber()

    const {
      stateUpdate,
      validRanges,
    }: TransactionResult = await this.stateManager.executeTransaction(
      transaction,
      blockNumber,
      witness
    )

    if (!rangesSpanRange(validRanges, transaction.range)) {
      throw Error(
        'Cannot ingest Transaction that is not valid across its entire range.'
      )
    }

    await this.blockManager.addPendingStateUpdate(stateUpdate)

    const blockTransaction: BlockTransaction = {
      blockNumber,
      transaction,
    }

    return {
      blockTransaction,
      witness: sign(this.privateKey, blockTransaction),
    }
  }

  public async getPublicKey(): Promise<any> {
    return this.publicKey
  }
}
