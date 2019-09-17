/* External Imports */
import { ethers } from 'ethers'
export const abi = new ethers.utils.AbiCoder()

export const transferAbiTypes = ['address', 'address', 'bool', 'uint32']
export const swapAbiTypes = ['address', 'bool', 'uint32', 'uint32', 'uint']
export const signedTransactionAbiTypes = ['bytes', 'bytes']
export const swapTransitionAbiTypes = [
  'bytes32',
  'uint32',
  'uint32',
  'bool',
  'uint32',
  'uint32',
  'uint',
  'bytes',
]
export const transferTransitionAbiTypes = [
  'bytes32',
  'uint32',
  'uint32',
  'bool',
  'uint32',
  'bytes',
]
export const createAndTransferTransitionAbiTypes = [
  'bytes32',
  'uint32',
  'uint32',
  'address',
  'bool',
  'uint32',
  'bytes',
]
