/* External Imports */
import {getLogger} from "@pigi/core";

/* Internal Imports */
import {
  CreateAndTransferTransition,
  isSwapTransaction,
  isTransferTransaction,
  SignedTransaction, State, StateReceipt,
  Swap,
  SwapTransition,
  RollupTransaction,
  Transfer,
  TransferTransition, RollupTransition, isSwapTransition, isTransferTransition, isCreateAndTransferTransition,
} from '../types'
import {
  abi,
  createAndTransferTransitionAbiTypes,
  signedTransactionAbiTypes, stateAbiTypes, stateReceiptAbiTypes,
  swapAbiTypes,
  swapTransitionAbiTypes,
  transferAbiTypes,
  transferTransitionAbiTypes,
} from './common'
import {PIGI_TOKEN_TYPE, UNI_TOKEN_TYPE} from "../index";
import {ethers} from "ethers";

const log = getLogger('abiEncoders')

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
export const abiEncodeTransaction = (transaction: RollupTransaction): string => {
  if (isSwapTransaction(transaction)) {
    return abiEncodeSwap(transaction)
  } else if (isTransferTransaction(transaction)) {
    return abiEncodeTransfer(transaction)
  }
  const message: string = `Unknown transaction type: ${JSON.stringify(transaction)}`
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
    return abiEncodeSwapTransition(transition)
  } else if (isTransferTransition(transition)) {
    return abiEncodeTransferTransition(transition)
  } else if (isCreateAndTransferTransition(transition)) {
    return abiEncodeCreateAndTransferTransition(transition)
  }
  const message: string = `Unknown transition type: ${JSON.stringify(transition)}`
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
    state.balances[PIGI_TOKEN_TYPE]
  ])
}

/**
 * ABI-encodes the provided StateReceipt
 * @param stateReceipt The StateReceipt to ABI-encode
 * @returns the ABI-encoded string.
 */
export const abiEncodeStateReceipt = (stateReceipt: StateReceipt): string => {
  return abi.encode(stateReceiptAbiTypes, [
    ethers.utils.formatBytes32String(stateReceipt.stateRoot),
    stateReceipt.blockNumber,
    stateReceipt.transitionIndex,
    stateReceipt.leafID,
    stateReceipt.inclusionProof.map(x => ethers.utils.formatBytes32String(x)),
    abiEncodeState(stateReceipt.state)
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
    trans.stateRoot,
    trans.senderLeafID,
    trans.uniswapLeafID,
    trans.tokenType,
    trans.inputAmount,
    trans.minOutputAmount,
    trans.timeout,
    trans.signature,
  ])
}

/**
 * ABI-encodes the provided TransferTransition.
 * @param trans The transition to AbI-encode.
 * @returns The ABI-encoded TransferTransition as a string.
 */
const abiEncodeTransferTransition = (
  trans: TransferTransition
): string => {
  return abi.encode(transferTransitionAbiTypes, [
    trans.stateRoot,
    trans.senderLeafID,
    trans.recipientLeafID,
    trans.tokenType,
    trans.amount,
    trans.signature,
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
    trans.stateRoot,
    trans.senderLeafID,
    trans.recipientLeafID,
    trans.createdAccountPubkey,
    trans.tokenType,
    trans.amount,
    trans.signature,
  ])
}
