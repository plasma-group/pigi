/* External Imports */
import BigNum = require('bn.js')

/* Internal Imports */
import { Expression } from './expression.interface'

export interface StateObject {
  predicate: string
  parameters: any
}

export interface StateUpdate {
  id: {
    start: BigNum
    end: BigNum
  }
  newState: StateObject
}

export interface Transaction {
  stateUpdate: StateUpdate
  witness: any
  block: number
}

export type InclusionProof = string[]

export interface ProofElementDeposit {
  transaction: Transaction
}

export interface ProofElementTransaction {
  transaction: Transaction
  inclusionProof: InclusionProof
}

export type ProofElement = ProofElementDeposit | ProofElementTransaction

export type TransactionProof = ProofElement[]

export interface StateQuery {
  plasmaContract: string
  predicateAddress: string
  start?: number
  end?: number
  method: string
  params: string[]
  filter?: Expression
}

interface StateQueryResult {
  stateUpdate: StateUpdate
  result: string[]
}
