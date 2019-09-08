/* Imports */
import { keccak256, abi, hexStrToBuf, bufToHexString } from '@pigi/core'

/* Export files */
export * from './RollupMerkleTree'
export * from './RollupBlock'

/* Misc Helpers */
export interface Transition {
  signedTransaction: {
    signature: string,
    transaction: string
  }
  postState: string
}

export function abiEncodeTransition(transition: Transition): Buffer {
  return hexStrToBuf(
    abi.encode(
      ['bytes', 'bytes', 'bytes32'],
      [transition.signedTransaction.signature, transition.signedTransaction.transaction, transition.postState]
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
  // Generate post state based on the transaction
  let postState = transaction
  // If the postState length is less than two, add zeros to it!
  while (postState.length < 2) {
    postState += '0'
  }
  postState = '0x' + postState.slice(0, 2).repeat(32)
  // Return the Transition!
  return {
    signedTransaction: {
      signature: '0x1234',
      transaction: '0x' + transaction,
    },
    postState,
  }
}

export function getEncodedTransition(transaction: string): string {
  return bufToHexString(abiEncodeTransition(getTransition(transaction)))
}
