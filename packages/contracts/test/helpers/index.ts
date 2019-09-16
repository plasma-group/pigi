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
  if (value.length > length*2) {
    throw new Error('Value too large to fit in ' + length + ' byte string')
  }
  const targetLength = length * 2
  while (value.length < (targetLength || 2)) {value = value + '0'}
  return '0x' + value
}

// Make a padded uint. Uints are left padded.
export function makePaddedUint(value: string, length: number): string {
  if (value.length > length*2) {
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
export type Transition = string

// Generates some number of dummy transitions
export function generateNTransitions(numTransitions: number) {
  const transitions = []
  for (let i = 0; i < numTransitions; i++) {
    transitions.push(makeRepeatedBytes(''+i, 32))
  }
  return transitions
}
