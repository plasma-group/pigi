import { DefaultWallet, BigNumber, abi } from '@pigi/core'

export type UNI = 0
export type PIGI = 1

export type SUCCESS = 'SUCCESS'
export type FAILURE = 'FAILURE'

export type Address = string

export interface Balances {
  uni: BigNumber
  pigi: BigNumber
}

export interface Swap {
  tokenType: UNI | PIGI
  inputAmount: BigNumber
  minOutputAmount: BigNumber
  timeout: number
}

export interface Transfer {
  tokenType: UNI | PIGI
  recipient: BigNumber
  amount: BigNumber
}

export interface TransactionReceipt {
  status: SUCCESS | FAILURE
  newBalances: Balances
}

export interface Storage {
  uniBalance: BigNumber
  pigiBalance: BigNumber
}
