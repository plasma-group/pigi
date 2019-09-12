import { InclusionProof } from '@pigi/core'

export type UniTokenType = 'uni'
export type PigiTokenType = 'pigi'
export type TokenType = UniTokenType | PigiTokenType

export type Address = string

export interface Balances {
  [tokenType: string]: number
}

export interface Swap {
  tokenType: UniTokenType | PigiTokenType
  inputAmount: number
  minOutputAmount: number
  timeout: number
}

/* Type guard for swap transaction */
export const isSwapTransaction = (
  transaction: Transaction
): transaction is Swap => {
  return 'minOutputAmount' in transaction
}

export interface Transfer {
  tokenType: UniTokenType | PigiTokenType
  recipient: Address
  amount: number
}

/* Type guard for transfer transaction */
export const isTransferTransaction = (
  transaction: Transaction
): transaction is Transfer => {
  return 'recipient' in transaction
}

export type Transaction = Swap | Transfer

export type Signature = string

export interface SignedTransaction {
  signature: Signature
  transaction: Transaction
}

export interface Storage {
  balances: Balances
}

export interface SignatureProvider {
  sign(address: string, message: string): Promise<string>
}

export interface State {
  [address: string]: Storage
}

export interface StateInclusionProof {
  [address: string]: string[]
}

export interface StateUpdate {
  transactions: SignedTransaction[]
  startRoot: string
  endRoot: string
  updatedState: State
  updatedStateInclusionProof: StateInclusionProof
}

export interface RollupBlock {
  number: number
  transactions: SignedTransaction[]
  startRoot: string
  endRoot: string
}

export interface TransactionReceipt {
  blockNumber: number
  transactionIndex: number
  transaction: SignedTransaction
  startRoot: string
  endRoot: string
  updatedState: State
  updatedStateInclusionProof: StateInclusionProof
}

export interface SignedTransactionReceipt extends TransactionReceipt {
  aggregatorSignature: Signature
}
