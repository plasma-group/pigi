import { should } from '../..//setup'

import {
  BigNumber,
  Secp256k1SignatureProvider,
  ONE,
  serializeObject,
  SignatureProvider,
} from '@pigi/core-utils'
import * as assert from 'assert'

import {
  AggregatorInterface,
  BlockTransactionCommitment,
  HistoryProof,
  StateManagerInterface,
  StateQuery,
  StateQueryResult,
  StateUpdate,
  Transaction,
  TransactionResult,
  BlockManagerInterface,
} from '../../../src'
import { Aggregator } from '../../../src/app/aggregator'
import { TestUtils } from '../test-utils'
import { transactionsEqual } from '../../../src/app/utils'

/*******************
 * Mocks & Helpers *
 *******************/

class DummyBlockManager implements BlockManagerInterface {
  private nextBlockNumber: BigNumber
  private readonly stateUpdates: StateUpdate[]

  constructor() {
    this.nextBlockNumber = ONE
    this.stateUpdates = []
  }

  public async addPendingStateUpdate(stateUpdate: StateUpdate): Promise<void> {
    this.stateUpdates.push(stateUpdate)
  }

  public async getNextBlockNumber(): Promise<BigNumber> {
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

class DummyStateManager implements StateManagerInterface {
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
    inBlock: BigNumber,
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
  let blockManager: DummyBlockManager
  let stateManager: DummyStateManager
  let aggregator: AggregatorInterface
  let aggregatorAddress: string
  let signatureProvider: SignatureProvider

  beforeEach(async () => {
    blockManager = new DummyBlockManager()
    stateManager = new DummyStateManager()
    signatureProvider = new Secp256k1SignatureProvider()
    aggregatorAddress = await signatureProvider.getAddress()
    aggregator = new Aggregator(
      stateManager,
      blockManager,
      aggregatorAddress,
      signatureProvider
    )
  })

  describe('ingestTransaction', () => {
    it('Ingests transaction correctly', async () => {
      const numTransactions: number = 5
      const transactionResults: TransactionResult[] = TestUtils.generateNSequentialTransactionResults(
        numTransactions
      )

      stateManager.setExecuteTransactionResults([...transactionResults])

      const transactions: Transaction[] = []
      transactionResults.forEach((result: TransactionResult) => {
        transactions.push({
          depositAddress: '',
          range: result.validRanges[0],
          body: {},
        })
      })

      for (let i = 0; i < numTransactions; i++) {
        const txCommitment: BlockTransactionCommitment = await aggregator.ingestTransaction(
          transactions[i]
        )
        assert(
          transactionsEqual(
            txCommitment.blockTransaction.transaction,
            transactions[i]
          ),
          'Resulting BlockTransactionCommitment does not match passed in Transaction.'
        )

        const serializedCommitment: string = serializeObject(
          txCommitment.blockTransaction
        )
        const signature: string = await signatureProvider.sign(
          serializedCommitment
        )
        assert(
          txCommitment.witness === signature,
          'commitment signature should match'
        )
      }

      const stateUpdates: StateUpdate[] = await blockManager.getPendingStateUpdates()

      assert(!!stateUpdates, 'State updates should not be undefined')
      assert(stateUpdates.length === numTransactions)
      for (let i = 0; i < numTransactions; i++) {
        stateUpdates[i].should.equal(transactionResults[i].stateUpdate)
      }
    })

    it('Throws if executeTransaction throws', async () => {
      stateManager.throwOnExecuteTransaction()

      try {
        await aggregator.ingestTransaction(undefined)
        assert(false, 'This should have thrown')
      } catch (e) {
        // This is success
      }
    })

    it('Throws if Transaction range is not valid', async () => {
      const transactionResult: TransactionResult = TestUtils.generateNSequentialTransactionResults(
        1
      )[0]

      stateManager.setExecuteTransactionResults([transactionResult])

      const transaction: Transaction = {
        depositAddress: '',
        range: {
          start: transactionResult.validRanges[0].start,
          end: transactionResult.validRanges[0].end.add(ONE),
        },
        body: {},
      }

      try {
        await aggregator.ingestTransaction(transaction)
        assert(false, 'This should have thrown')
      } catch (e) {
        // This is success
      }
    })
  })
})
