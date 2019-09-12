/* Imports */
import { keccak256, abi, hexStrToBuf, bufToHexString } from '@pigi/core'

/* Export files */
export * from './RollupMerkleTree'
export * from './RollupBlock'

/**********************************
 * Byte String Generation Helpers *
 *********************************/

// Create a byte string of some length in bytes. It repeats the value provided until the
// string hits that length
export function makeRepeatedBytes(value: string, length: number): string {
  const result = value.repeat(length * 2 / value.length).slice(0, length * 2)
  return '0x' + result
}

// Make padded bytes. Bytes are right padded.
export function makePaddedBytes(value: string, length: number): string {
  if (value.length > length) {
    throw new Error('Value too large to fit in ' + length + ' byte string')
  }
  const targetLength = length * 2
  while (value.length < (targetLength || 2)) {value = value + '0'}
  return '0x' + value
}

// Make a padded uint. Uints are left padded.
export function makePaddedUint(value: string, length: number): string {
  if (value.length > length) {
    throw new Error('Value too large to fit in ' + length + ' byte string')
  }
  const targetLength = length * 2
  while (value.length < (targetLength || 2)) {value = '0' + value}
  return '0x' + value
}

export const ZERO_BYTES32 = makeRepeatedBytes('0', 32)
export const ZERO_ADDRESS = makeRepeatedBytes('0', 20)
export const ZERO_UINT32 = makeRepeatedBytes('0', 4)
export const ZERO_SIGNATURE = makeRepeatedBytes('0', 65)


/*******************************
 * Transition Encoding Helpers *
 ******************************/
export interface Transition {
  signedTx: {
    signature: string
    body: string
  }
  postState: string
}

export function abiEncodeTransition(transition: Transition): Buffer {
  return hexStrToBuf(
    abi.encode(
      ['bytes', 'bytes', 'bytes32'],
      [
        transition.signedTx.signature,
        transition.signedTx.body,
        transition.postState,
      ]
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

// Creates an encoded transition with the specified tx (transaction)
export function getTransition(tx: string): Transition {
  // Generate post state based on the tx
  let postState = tx
  // If the postState length is less than two, add zeros to it!
  while (postState.length < 2) {
    postState += '0'
  }
  postState = '0x' + postState.slice(0, 2).repeat(32)
  // Return the Transition!
  return {
    signedTx: {
      signature: '0x1234',
      body: '0x' + tx,
    },
    postState,
  }
}

export function getEncodedTransition(tx: string): string {
  return bufToHexString(abiEncodeTransition(getTransition(tx)))
}
