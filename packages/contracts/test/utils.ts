import { keccak256, abi, hexStrToBuf, bufToHexString } from '@pigi/core'

/* Helpers */
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
