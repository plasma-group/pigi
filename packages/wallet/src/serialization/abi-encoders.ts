/* External Imports */
import { add0x, BigNumber, getLogger, serializeObject } from '@pigi/core'

/* Internal Imports */
import {
  CreateAndTransferTransition,
  isSwapTransaction,
  isTransferTransaction,
  SignedTransaction,
  State,
  StateReceipt,
  Swap,
  SwapTransition,
  RollupTransaction,
  Transfer,
  TransferTransition,
  RollupTransition,
  isSwapTransition,
  isTransferTransition,
  isCreateAndTransferTransition,
} from '../types'
import {
  abi,
  createAndTransferTransitionAbiTypes,
  signedTransactionAbiTypes,
  stateAbiTypes,
  stateReceiptAbiTypes,
  swapAbiTypes,
  swapTransitionAbiTypes,
  transferAbiTypes,
  transferTransitionAbiTypes,
} from './common'
import { PIGI_TOKEN_TYPE, UNI_TOKEN_TYPE } from '../index'
import { ethers } from 'ethers'

const log = getLogger('rollup-abiEncoders')

/**
 * ABI-encodes the provided SignedTransaction.
 * @param signedTransaction The SignedTransaction to AbI-encode.
 * @returns The ABI-encoded SignedTransaction as a string.
 */
export const abiEncodeSignedTransaction = (
  signedTransaction: SignedTransaction
): string => {
  return abi.encode(signedTransactionAbiTypes, [
    signedTransaction.signature,
    abiEncodeTransaction(signedTransaction.transaction),
  ])
}

/**
 * ABI-encodes the provided RollupTransaction.
 * @param transaction The transaction to AbI-encode.
 * @returns The ABI-encoded RollupTransaction as a string.
 */
export const abiEncodeTransaction = (
  transaction: RollupTransaction
): string => {
  if (isSwapTransaction(transaction)) {
    return abiEncodeSwap(transaction)
  } else if (isTransferTransaction(transaction)) {
    return abiEncodeTransfer(transaction)
  }
  const message: string = `Unknown transaction type: ${JSON.stringify(
    transaction
  )}`
  log.error(message)
  throw Error(message)
}

/**
 * ABI-encodes the provided RollupTransition.
 * @param transition The transition to AbI-encode.
 * @returns The ABI-encoded RollupTransition as a string.
 */
export const abiEncodeTransition = (transition: RollupTransition): string => {
  if (isSwapTransition(transition)) {
    log.debug(`Encoding SwapTransition: ${serializeObject(transition)}`)
    return abiEncodeSwapTransition(transition)
  } else if (isTransferTransition(transition)) {
    log.debug(`Encoding TransferTransition: ${serializeObject(transition)}`)
    return abiEncodeTransferTransition(transition)
  } else if (isCreateAndTransferTransition(transition)) {
    log.debug(
      `Encoding CreateAndTransferTransition: ${serializeObject(transition)}`
    )
    return abiEncodeCreateAndTransferTransition(transition)
  }
  const message: string = `Unknown transition type: ${JSON.stringify(
    transition
  )}`
  log.error(message)
  throw Error(message)
}

/**
 * ABI-encodes the provided State
 * @param state The state to ABI-encode
 * @returns the ABI-encoded string.
 */
export const abiEncodeState = (state: State): string => {
  return abi.encode(stateAbiTypes, [
    state.address,
    state.balances[UNI_TOKEN_TYPE],
    state.balances[PIGI_TOKEN_TYPE],
  ])
}

/**
 * ABI-encodes the provided StateReceipt
 * @param stateReceipt The StateReceipt to ABI-encode
 * @returns the ABI-encoded string.
 */
export const abiEncodeStateReceipt = (stateReceipt: StateReceipt): string => {
  return abi.encode(stateReceiptAbiTypes, [
    add0x(stateReceipt.stateRoot),
    stateReceipt.blockNumber,
    stateReceipt.transitionIndex,
    stateReceipt.leafID,
    stateReceipt.inclusionProof.map((hex) => add0x(hex)),
    abiEncodeState(stateReceipt.state),
  ])
}

/*********************
 * PRIVATE FUNCTIONS *
 *********************/

/**
 * ABI-encodes the provided Transfer.
 * @param transfer The Transfer to AbI-encode.
 * @returns The ABI-encoded Transfer as a string.
 */
const abiEncodeTransfer = (transfer: Transfer): string => {
  return abi.encode(transferAbiTypes, [
    transfer.sender,
    transfer.recipient,
    transfer.tokenType,
    transfer.amount,
  ])
}

/**
 * ABI-encodes the provided Swap.
 * @param swap The Swap to AbI-encode.
 * @returns The ABI-encoded Swap as a string.
 */
const abiEncodeSwap = (swap: Swap): string => {
  return abi.encode(swapAbiTypes, [
    swap.sender,
    swap.tokenType,
    swap.inputAmount,
    swap.minOutputAmount,
    swap.timeout,
  ])
}

/**
 * ABI-encodes the provided SwapTransition.
 * @param trans The transition to AbI-encode.
 * @returns The ABI-encoded SwapTransition as a string.
 */
const abiEncodeSwapTransition = (trans: SwapTransition): string => {
  return abi.encode(swapTransitionAbiTypes, [
    add0x(trans.stateRoot),
    trans.senderLeafID,
    trans.uniswapLeafID,
    trans.tokenType,
    trans.inputAmount,
    trans.minOutputAmount,
    trans.timeout,
    ethers.utils.toUtf8Bytes(trans.signature),
  ])
}

/**
 * ABI-encodes the provided TransferTransition.
 * @param trans The transition to AbI-encode.
 * @returns The ABI-encoded TransferTransition as a string.
 */
const abiEncodeTransferTransition = (trans: TransferTransition): string => {
  return abi.encode(transferTransitionAbiTypes, [
    add0x(trans.stateRoot),
    trans.senderLeafID,
    trans.recipientLeafID,
    trans.tokenType,
    trans.amount,
    ethers.utils.toUtf8Bytes(trans.signature),
  ])
}

/**
 * ABI-encodes the provided CreateAndTransferTransition.
 * @param trans The transition to AbI-encode.
 * @returns The ABI-encoded CreateAndTransferTransition as a string.
 */
const abiEncodeCreateAndTransferTransition = (
  trans: CreateAndTransferTransition
): string => {
  return abi.encode(createAndTransferTransitionAbiTypes, [
    add0x(trans.stateRoot),
    trans.senderLeafID,
    trans.recipientLeafID,
    trans.createdAccountPubkey,
    trans.tokenType,
    trans.amount,
    ethers.utils.toUtf8Bytes(trans.signature),
  ])
}