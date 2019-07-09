import BigNum = require('bn.js')
import { should } from '../../setup'

import {
  Aggregator,
  BlockManager,
  HistoryProof,
  StateManager,
  StateQuery,
  StateQueryResult,
  StateUpdate,
  Transaction,
  TransactionResult,
} from '../../../src/types'
import { DefaultAggregator, ONE, ZERO } from '../../../src/app/'
import { TestUtils } from '../utils/test-utils'
import * as assert from 'assert'

/*******************
 * Mocks & Helpers *
 *******************/

class DummyBlockManager implements BlockManager {
  private nextBlockNumber: BigNum
  private readonly stateUpdates: StateUpdate[]

  constructor() {
    this.nextBlockNumber = ONE
    this.stateUpdates = []
  }

  public async addPendingStateUpdate(stateUpdate: StateUpdate): Promise<void> {
    this.stateUpdates.push(stateUpdate)
  }

  public async getNextBlockNumber(): Promise<BigNum> {
    return this.nextBlockNumber
  }

  public async getPendingStateUpdates(): Promise<StateUpdate[]> {
    return this.stateUpdates
  }

  public async submitNextBlock(): Promise<void> {
    this.stateUpdates.length = 0
    this.nextBlockNumber = this.nextBlockNumber.add(ONE)
  }
}

class DummyStateManager implements StateManager {
  private throwOnExecute: boolean = false
  private executeTransactionResults: TransactionResult[]

  public setExecuteTransactionResults(
    transactionResults: TransactionResult[]
  ): void {
    this.executeTransactionResults = transactionResults
  }

  public throwOnExecuteTransaction(): void {
    this.throwOnExecute = true
  }

  public async executeTransaction(
    transaction: Transaction,
    inBlock: BigNum,
    witness: string
  ): Promise<TransactionResult> {
    if (this.throwOnExecute) {
      this.throwOnExecute = false
      throw Error('I was configured to throw')
    }
    return this.executeTransactionResults.shift()
  }

  public async ingestHistoryProof(historyProof: HistoryProof): Promise<void> {
    return undefined
  }

  public async queryState(query: StateQuery): Promise<StateQueryResult[]> {
    return undefined
  }
}

/*********
 * TESTS *
 *********/

describe('DefaultAggregator', () => {
  describe('ingestTransaction', () => {
    it('Ingests transaction correctly', async () => {
      const numTransactions: number = 5
      const transactionResults: TransactionResult[] = TestUtils.generateNSequentialTransactionResults(
        numTransactions
      )

      const blockManager: DummyBlockManager = new DummyBlockManager()
      const stateManager: DummyStateManager = new DummyStateManager()
      stateManager.setExecuteTransactionResults([...transactionResults])

      const aggregator: Aggregator = new DefaultAggregator(
        stateManager,
        blockManager
      )

      const transaction: Transaction = {
        depositAddress: '',
        range: {
          start: ZERO,
          end: ONE,
        },
        body: {},
      }

      for (let i = 0; i < numTransactions; i++) {
        await aggregator.ingestTransaction(transaction, '')
      }

      const stateUpdates: StateUpdate[] = await blockManager.getPendingStateUpdates()

      stateUpdates.length.should.equal(numTransactions)
      for (let i = 0; i < numTransactions; i++) {
        stateUpdates[i].should.equal(transactionResults[i].stateUpdate)
      }
    })

    it('Throws if executeTransaction throws', async () => {
      const blockManager: DummyBlockManager = new DummyBlockManager()
      const stateManager: DummyStateManager = new DummyStateManager()
      stateManager.throwOnExecuteTransaction()

      const aggregator: Aggregator = new DefaultAggregator(
        stateManager,
        blockManager
      )

      try {
        await aggregator.ingestTransaction(undefined, '')
        assert(false, 'This should have thrown')
      } catch (e) {
        // This is success
      }
    })
  })
})
