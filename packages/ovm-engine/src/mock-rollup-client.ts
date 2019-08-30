/* External Imports */
import { BigNumber, abi, KeyValueStore, Wallet, SimpleClient } from '@pigi/core'

/* Internal Imports */
import {
  Address,
  Balances,
  Swap,
  isSwapTransaction,
  Transfer,
  isTransferTransaction,
  Storage,
  Transaction,
  MockedSignature,
  SignedTransaction,
  TransactionReceipt,
} from '.'

type PluginType = 'ROLLUP'

export class MockRollupClient {
  public jsonRpcClient: SimpleClient
  public accounts: { Address: Storage }
  public uniswapAddress: Address

  constructor(
    readonly db: KeyValueStore,
    readonly sign: (address: string, message: string) => Promise<string>
  ) {}

  public connect(aggregatorBaseUrl: string) {
    // Create a new simple JSON rpc server for the rollup client
    this.jsonRpcClient = new SimpleClient(aggregatorBaseUrl)
    // TODO: Persist the aggregator url
  }

  public async getBalances(account: Address): Promise<Balances> {
    return this.accounts[account].balances
  }

  private ecdsaRecover(signature: MockedSignature): Address {
    // TODO: Move this out of this class and instead put in keystore
    return signature
  }

  public async applyTransaction(
    signedTransaction: SignedTransaction
  ): Promise<TransactionReceipt> {
    const sender: Address = signedTransaction.signature
    const transaction: Transaction = signedTransaction.transaction
    if (isTransferTransaction(transaction)) {
      return this.applyTransfer(sender, transaction)
    } else if (isSwapTransaction(transaction)) {
      return this.applySwap(sender, transaction)
    }
  }

  private applyTransfer(
    sender: Address,
    transfer: Transfer
  ): TransactionReceipt {
    return {
      status: 'SUCCESS',
      contents: 'You win the lottery!',
    }
  }

  private applySwap(sender: Address, swap: Swap): TransactionReceipt {
    return {
      status: 'SUCCESS',
      contents: 'You win the lottery!',
    }
  }
}
