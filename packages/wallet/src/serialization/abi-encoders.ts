/**
 * @returns the ABI-encoded Transfer.
 */
import {
  CreateAndTransferTransition,
  isSwapTransaction,
  isTransferTransaction,
  SignedTransaction,
  Swap,
  SwapTransition,
  Transaction,
  Transfer,
  TransferTransition,
} from '../types'
import {
  abi,
  createAndTransferTransitionAbiTypes,
  signedTransactionAbiTypes,
  swapAbiTypes,
  swapTransitionAbiTypes,
  transferAbiTypes,
  transferTransitionAbiTypes,
} from './common'

/**
 * @returns the ABI-encoded Transfer.
 */
export const abiEncodeTransfer = (transfer: Transfer): string => {
  return abi.encode(transferAbiTypes, [
    transfer.sender,
    transfer.recipient,
    transfer.tokenType,
    transfer.amount,
  ])
}

/**
 * @returns the ABI-encoded Swap.
 */
export const abiEncodeSwap = (swap: Swap): string => {
  return abi.encode(swapAbiTypes, [
    swap.sender,
    swap.tokenType,
    swap.inputAmount,
    swap.minOutputAmount,
    swap.timeout,
  ])
}

/**
 * @returns the ABI-encoded SignedTransaction.
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
 * @returns the ABI-encoded SwapTransition.
 */
export const abiEncodeSwapTransition = (trans: SwapTransition): string => {
  return abi.encode(swapTransitionAbiTypes, [
    trans.stateRoot,
    trans.senderSlot,
    trans.recipientSlot,
    trans.tokenType,
    trans.inputAmount,
    trans.minOutputAmount,
    trans.timeout,
    trans.signature,
  ])
}

/**
 * @returns the ABI-encoded TransferTransition.
 */
export const abiEncodeTransferTransition = (
  trans: TransferTransition
): string => {
  return abi.encode(transferTransitionAbiTypes, [
    trans.stateRoot,
    trans.senderSlot,
    trans.recipientSlot,
    trans.tokenType,
    trans.amount,
    trans.signature,
  ])
}

/**
 * @returns the ABI-encoded CreateAndTransferTransition.
 */
export const abiEncodeCreateAndTransferTransition = (
  trans: CreateAndTransferTransition
): string => {
  return abi.encode(createAndTransferTransitionAbiTypes, [
    trans.stateRoot,
    trans.senderSlot,
    trans.recipientSlot,
    trans.createdAccountPubkey,
    trans.tokenType,
    trans.amount,
    trans.signature,
  ])
}

/**
 * ABI-encodes the provided Transaction.
 * @param transaction The transaction to AbI-encode.
 * @returns The ABI-encoded Transaction as a string.
 */
export const abiEncodeTransaction = (transaction: Transaction): string => {
  if (isSwapTransaction(transaction)) {
    return abiEncodeSwap(transaction)
  } else if (isTransferTransaction(transaction)) {
    return abiEncodeTransfer(transaction)
  }
  throw Error(`Unknown transaction type: ${JSON.stringify(transaction)}`)
}
