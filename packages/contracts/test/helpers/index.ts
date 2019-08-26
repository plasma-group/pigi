/* Imports */
import { keccak256, abi, hexStrToBuf, bufToHexString } from '@pigi/core'

/* Export files */
export * from './RollupMerkleTree'
export * from './RollupBlock'

/* Misc Helpers */
export interface Transition {
  transaction: string
  postState: string
}

export function abiEncodeTransition(transition: Transition): Buffer {
  return hexStrToBuf(
    abi.encode(
      ['bytes', 'bytes32'],
      [transition.transaction, transition.postState]
    )
  )
}

// Generates some number of dummy transitions
export function generateNTransitions(numTransitions: number) {
  const transitions = []
  for (let i = 0; i < numTransitions; i++) {
    transitions.push(getTransition('' + i))
  }
  return transitions
}

// Creates an encoded transition with the specified transaction
export function getTransition(transaction: string): Transition {
  return {
    transaction: '0x' + transaction,
    postState: '0x' + '00'.repeat(32),
  }
}

export function getEncodedTransition(transaction: string): string {
  return bufToHexString(abiEncodeTransition(getTransition(transaction)))
}
