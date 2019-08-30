/* External Imports */
import { abi, KeyValueStore, Wallet, RpcClient } from '@pigi/core'

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
  UNISWAP_ADDRESS,
} from '.'

interface State {
  [address: string]: Storage
}

export class MockRollupStateMachine {
  public state: State

  constructor(genesisState: State) {
    this.state = genesisState
  }

  public getBalances(account: Address): Balances {
    return this.state[account].balances
  }

  public getUniswapBalances(): Balances {
    return this.state[UNISWAP_ADDRESS].balances
  }

  private ecdsaRecover(signature: MockedSignature): Address {
    // TODO: Move this out of this class and instead put in keystore
    return signature
  }

  public applyTransaction(
    signedTransaction: SignedTransaction
  ): TransactionReceipt {
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
