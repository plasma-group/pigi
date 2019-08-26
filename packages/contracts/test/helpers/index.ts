/* Imports */
import { keccak256, abi, hexStrToBuf, bufToHexString } from '@pigi/core'

/* Export files */
export * from './RollupMerkleTree'

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
