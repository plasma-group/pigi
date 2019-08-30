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
  UNI_TOKEN_TYPE,
  PIGI_TOKEN_TYPE,
  TokenType,
} from '.'

const DEFAULT_STORAGE = {
  balances: {
    uni: 0,
    pigi: 0,
  },
}

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
    throw new Error('Transaction type not recognized')
  }

  private getFailureTxReceipt(message: any): TransactionReceipt {
    return {
      status: 'FAILURE',
      message,
    }
  }

  private getSuccessTxReceipt(message: any): TransactionReceipt {
    return {
      status: 'SUCCESS',
      message,
    }
  }

  private hasEnoughMoney(
    account: string,
    tokenType: TokenType,
    greaterThanAmount: number
  ) {
    // Check that the account has more than some amount of pigi/uni
    if (
      !(account in this.state) ||
      this.state[account].balances[tokenType] < greaterThanAmount
    ) {
      return false
    }
    return true
  }

  private applyTransfer(
    sender: Address,
    transfer: Transfer
  ): TransactionReceipt {
    // Make sure the amount is above zero
    if (transfer.amount < 1) {
      return this.getFailureTxReceipt('Cannot send negative numbers!')
    }
    // Check that the sender has enough money
    if (!this.hasEnoughMoney(sender, transfer.tokenType, transfer.amount)) {
      return this.getFailureTxReceipt('Sender does not have enough money!')
    }
    // Make sure we've got a record for the recipient
    if (!(transfer.recipient in this.state)) {
      // If not, make a record
      this.state[transfer.recipient] = {
        balances: {
          uni: 0,
          pigi: 0,
        },
      }
    }
    // Update the balances
    this.state[sender].balances[transfer.tokenType] -= transfer.amount
    this.state[transfer.recipient].balances[transfer.tokenType] +=
      transfer.amount
    return this.getSuccessTxReceipt({
      sender: this.state[sender],
      recipient: this.state[transfer.recipient],
    })
  }

  private applySwap(sender: Address, swap: Swap): TransactionReceipt {
    // Make sure the amount is above zero
    if (swap.inputAmount < 1) {
      return this.getFailureTxReceipt('Cannot send negative numbers!')
    }
    // Check that the sender has enough money
    if (!this.hasEnoughMoney(sender, swap.tokenType, swap.inputAmount)) {
      return this.getFailureTxReceipt('Sender does not have enough money!')
    }
    // TODO: Check the swap hasn't expired!

    // Swap the tokens!
    // First let's figure out which token types are input & output
    const inputTokenType = swap.tokenType
    const outputTokenType =
      swap.tokenType === UNI_TOKEN_TYPE ? PIGI_TOKEN_TYPE : UNI_TOKEN_TYPE
    // Next let's calculate the invarient
    const uniswapBalances = this.state[UNISWAP_ADDRESS].balances
    const invarient = uniswapBalances.uni * uniswapBalances.pigi
    // Now calculate the total input tokens
    const totalInput = swap.inputAmount + uniswapBalances[inputTokenType]
    const newOutputBalance = Math.ceil(invarient / totalInput)
    const outputAmount = uniswapBalances[outputTokenType] - newOutputBalance
    // Let's make sure the output amount is above the minimum
    if (outputAmount < swap.minOutputAmount) {
      return this.getFailureTxReceipt('Too much slippage!')
    }
    // Finally let's update the state!
    // First uniswap...
    this.state[UNISWAP_ADDRESS].balances[inputTokenType] = totalInput
    this.state[UNISWAP_ADDRESS].balances[outputTokenType] = newOutputBalance
    // Then the sender...
    this.state[sender].balances[inputTokenType] -= swap.inputAmount
    this.state[sender].balances[outputTokenType] += outputAmount
    return {
      status: 'SUCCESS',
      message: {
        sender: this.state[sender],
        uniswap: this.state[UNISWAP_ADDRESS],
      },
    }
  }
}
