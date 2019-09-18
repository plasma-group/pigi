import { BigNumber } from '@pigi/core'

export type UniTokenType = 0
export type PigiTokenType = 1
export type TokenType = UniTokenType | PigiTokenType

export type Address = string

export type RollupTransaction = Swap | Transfer | FaucetRequest
export type Signature = string
export type InclusionProof = string[]
export type RollupTransition =
  | SwapTransition
  | TransferTransition
  | CreateAndTransferTransition

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

export interface Transfer {
  sender: Address
  recipient: Address
  tokenType: UniTokenType | PigiTokenType
  amount: number
}

export interface FaucetRequest {
  sender: Address
  // Todo: might want to change this to token -> amount map
  amount: number
}

export interface SignedTransaction {
  signature: Signature
  transaction: RollupTransaction
}

export interface State {
  address: Address
  balances: Balances
}

export interface SignatureProvider {
  sign(address: string, message: string): Promise<string>
}

export interface StateUpdate {
  transaction: SignedTransaction
  stateRoot: string
  senderLeafID: number
  receiverLeafID: number
  senderState: State
  senderStateInclusionProof: InclusionProof
  receiverState: State
  receiverStateInclusionProof: InclusionProof
  receiverCreated: boolean
}

export interface RollupBlock {
  number: number
  transitions: RollupTransition[]
}

export interface StateSnapshot {
  leafID: number
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
  senderLeafID: number
  uniswapLeafID: number
  tokenType: number
  inputAmount: number
  minOutputAmount: number
  timeout: number
  signature: string
}

export interface TransferTransition {
  stateRoot: string
  senderLeafID: number
  recipientLeafID: number
  tokenType: number
  amount: number
  signature: string
}

export interface CreateAndTransferTransition extends TransferTransition {
  createdAccountPubkey: string
}

/*** Type Determination Functions ***/

export const isSwapTransaction = (
  transaction: RollupTransaction
): transaction is Swap => {
  return 'minOutputAmount' in transaction
}

export const isTransferTransaction = (
  transaction: RollupTransaction
): transaction is Transfer => {
  return 'recipient' in transaction
}

export const isFaucetTransaction = (
  transaction: RollupTransaction
): transaction is FaucetRequest => {
  return !isSwapTransaction(transaction) && !isTransferTransaction(transaction)
}

export const isSwapTransition = (
  transition: RollupTransition
): transition is SwapTransition => {
  return 'uniswapLeafID' in transition
}

export const isCreateAndTransferTransition = (
  transition: RollupTransition
): transition is CreateAndTransferTransition => {
  return 'createdAccountPubkey' in transition
}

export const isTransferTransition = (
  transition: RollupTransition
): transition is TransferTransition => {
  return (
    !isSwapTransition(transition) && !isCreateAndTransferTransition(transition)
  )
}
