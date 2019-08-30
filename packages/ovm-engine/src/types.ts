import { DefaultWallet, BigNumber, abi } from '@pigi/core'

export type UNI = 0
export type PIGI = 1

export type SUCCESS = 'SUCCESS'
export type FAILURE = 'FAILURE'

export type Address = string

export interface Balances {
  [tokenType: string]: BigNumber
}

export interface Swap {
  tokenType: UNI | PIGI
  inputAmount: BigNumber
  minOutputAmount: BigNumber
  timeout: number
}

/* Type guard for swap transaction */
export const isSwapTransaction = (
  transaction: Transaction
): transaction is Swap => {
  return 'minOutputAmoun' in transaction
}

export interface Transfer {
  tokenType: UNI | PIGI
  recipient: Address
  amount: BigNumber
}

/* Type guard for transfer transaction */
export const isTransferTransaction = (
  transaction: Transaction
): transaction is Transfer => {
  return 'recipient' in transaction
}

export type Transaction = Swap | Transfer

export type MockedSignature = Address

export interface SignedTransaction {
  signature: MockedSignature // For now the signature is just the address
  transaction: Transaction
}

export interface TransactionReceipt {
  status: SUCCESS | FAILURE
  contents: any
}

export interface Storage {
  balances: Balances
}

type Signature = Buffer

export interface SignatureProvider {
  sign(address: string, message: string): Promise<string>
}

export interface Client {
  getBalances(account: Address): Promise<Balances>
  applyTransaction(transaction: SignedTransaction): Promise<TransactionReceipt>
}
