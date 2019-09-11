/* External Imports */
import {
  DefaultSignatureVerifier,
  serializeObject,
  SignatureVerifier,
} from '@pigi/core'

/* Internal Imports */
import {
  Address,
  Balances,
  Swap,
  isSwapTransaction,
  Transfer,
  isTransferTransaction,
  Transaction,
  SignedTransaction,
  TransactionReceipt,
  UNISWAP_ADDRESS,
  UNI_TOKEN_TYPE,
  PIGI_TOKEN_TYPE,
  TokenType,
  State,
} from '../index'
import {
  InsufficientBalanceError,
  InvalidTransactionTypeError,
  NegativeAmountError,
  RollupStateMachine,
  SlippageError,
} from '../types'

const DEFAULT_STORAGE = {
  balances: {
    uni: 0,
    pigi: 0,
  },
}

export class MockRollupStateMachine implements RollupStateMachine {
  private readonly state: State

  constructor(
    genesisState: State,
    private readonly signatureVerifier: SignatureVerifier = DefaultSignatureVerifier.instance(),
    private swapFeeBasisPoints: number = 30
  ) {
    this.state = genesisState
  }

  public async getBalances(account: Address): Promise<Balances> {
    return this._getBalances(account, false)
  }

  public async applyTransaction(
    signedTransaction: SignedTransaction
  ): Promise<State> {
    let sender: Address

    try {
      sender = this.signatureVerifier.verifyMessage(
        serializeObject(signedTransaction.transaction),
        signedTransaction.signature
      )
    } catch (e) {
      throw e
    }

    const transaction: Transaction = signedTransaction.transaction
    if (isTransferTransaction(transaction)) {
      return this.applyTransfer(sender, transaction)
    } else if (isSwapTransaction(transaction)) {
      return this.applySwap(sender, transaction)
    }
    throw new InvalidTransactionTypeError()
  }

  private _getBalances(
    account: Address,
    createIfAbsent: boolean = true
  ): Balances {
    if (!(account in this.state)) {
      const balances = {
        uni: 0,
        pigi: 0,
      }

      if (!createIfAbsent) {
        return balances
      }

      this.state[account] = { balances }
    }
    return this.state[account].balances
  }

  private getTxReceipt(stateUpdate: any): TransactionReceipt {
    return {
      aggregatorSignature: 'MOCKED',
      stateUpdate,
    }
  }

  private hasBalance(account: Address, tokenType: TokenType, balance: number) {
    // Check that the account has more than some amount of pigi/uni
    const balances = this._getBalances(account, false)
    return balances[tokenType] >= balance
  }

  private applyTransfer(sender: Address, transfer: Transfer): State {
    // Make sure the amount is above zero
    if (transfer.amount < 1) {
      throw new NegativeAmountError()
    }

    // Check that the sender has enough money
    if (!this.hasBalance(sender, transfer.tokenType, transfer.amount)) {
      throw new InsufficientBalanceError()
    }

    // Update the balances
    this._getBalances(sender)[transfer.tokenType] -= transfer.amount
    this._getBalances(transfer.recipient)[transfer.tokenType] += transfer.amount

    return {
      [sender]: this.state[sender],
      [transfer.recipient]: this.state[transfer.recipient],
    }
  }

  private applySwap(sender: Address, swap: Swap): State {
    // Make sure the amount is above zero
    if (swap.inputAmount < 1) {
      throw new NegativeAmountError()
    }
    // Check that the sender has enough money
    if (!this.hasBalance(sender, swap.tokenType, swap.inputAmount)) {
      throw new InsufficientBalanceError()
    }
    // Check that we'll have ample time to include the swap
    // TODO

    // Set the post swap balances
    this.updateBalancesFromSwap(swap, sender)

    // Return a succssful swap!
    return {
      [sender]: this.state[sender],
      [UNISWAP_ADDRESS]: this.state[UNISWAP_ADDRESS],
    }
  }

  private updateBalancesFromSwap(swap: Swap, sender: Address): void {
    const uniswapBalances: Balances = this._getBalances(UNISWAP_ADDRESS)
    // First let's figure out which token types are input & output
    const inputTokenType = swap.tokenType
    const outputTokenType =
      swap.tokenType === UNI_TOKEN_TYPE ? PIGI_TOKEN_TYPE : UNI_TOKEN_TYPE
    // Next let's calculate the invariant
    const invariant = uniswapBalances.uni * uniswapBalances.pigi
    // Now calculate the total input tokens
    const totalInput =
      this.assessSwapFee(swap.inputAmount) + uniswapBalances[inputTokenType]
    const newOutputBalance = Math.ceil(invariant / totalInput)
    const outputAmount = uniswapBalances[outputTokenType] - newOutputBalance
    // Let's make sure the output amount is above the minimum
    if (outputAmount < swap.minOutputAmount) {
      throw new SlippageError()
    }

    const userBalances: Balances = this._getBalances(sender)
    // Calculate the new user & swap balances
    userBalances[inputTokenType] -= swap.inputAmount
    userBalances[outputTokenType] += outputAmount

    uniswapBalances[inputTokenType] += swap.inputAmount
    uniswapBalances[outputTokenType] = newOutputBalance
  }

  /**
   * Assesses the fee charged for a swap.
   *
   * @param amountBeforeFee The amount of the swap
   * @return the amount, accounting for the fee
   */
  private assessSwapFee(amountBeforeFee: number): number {
    if (this.swapFeeBasisPoints === 0) {
      return amountBeforeFee
    }
    return amountBeforeFee * ((10_000.0 - this.swapFeeBasisPoints) / 10_000.0)
  }
}
