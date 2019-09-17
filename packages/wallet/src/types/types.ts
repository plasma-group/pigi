import { InclusionProof } from '@pigi/core'

export type UniTokenType = 0
export type PigiTokenType = 1
export type TokenType = UniTokenType | PigiTokenType

export type Address = string

export interface Balances {
  [tokenType: string]: number
}

export interface Swap {
  sender: Address
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
  sender: Address
  recipient: Address
  tokenType: UniTokenType | PigiTokenType
  amount: number
}

/* Type guard for transfer transaction */
export const isTransferTransaction = (
  transaction: Transaction
): transaction is Transfer => {
  return 'recipient' in transaction
}

export interface FaucetRequest {
  sender: Address
  // Todo: might want to change this to token -> amount map
  amount: number
}

export const isFaucetTransaction = (
  transaction: Transaction
): transaction is FaucetRequest => {
  return !isSwapTransaction(transaction) && !isTransferTransaction(transaction)
}

export type Transaction = Swap | Transfer | FaucetRequest

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

export type InclusionProof = string[]

export interface StateInclusionProof {
  [address: string]: InclusionProof
}

export interface StateUpdate {
  transactions: SignedTransaction[]
  startRoot: string
  endRoot: string
  updatedState: State
  updatedStateInclusionProof: StateInclusionProof
}

export interface RollupTransition {
  number: number
  blockNumber: number
  transactions: SignedTransaction[]
  startRoot: string
  endRoot: string
}

export interface RollupBlock {
  number: number
  transitions: RollupTransition[]
}

export interface TransactionReceipt {
  blockNumber: number
  transitionIndex: number
  transaction: SignedTransaction
  startRoot: string
  endRoot: string
  updatedState: State
  updatedStateInclusionProof: StateInclusionProof
}

export interface SignedTransactionReceipt {
  transactionReceipt: TransactionReceipt
  signature: Signature
}

export interface StateSnapshot {
  address: string
  state: State
  stateRoot: string
  inclusionProof: InclusionProof
}

export interface StateReceipt extends StateSnapshot {
  blockNumber: number
  transitionIndex: number
}

export interface SignedStateReceipt {
  stateReceipt: StateReceipt
  signature: Signature
}

export interface SwapTransition {
  stateRoot: string
  senderSlot: number
  recipientSlot: number
  tokenType: number
  inputAmount: number
  minOutputAmount: number
  timeout: number
  signature: string
}

export interface TransferTransition {
  stateRoot: string
  senderSlot: number
  recipientSlot: number
  tokenType: number
  amount: number
  signature: string
}

export interface CreateAndTransferTransition extends TransferTransition {
  createdAccountPubkey: string
}
