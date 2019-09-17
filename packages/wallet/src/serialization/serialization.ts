/* External Imports */
import { ethers } from 'ethers'

/* Internal Imports */
import {
  CreateAndTransferTransition,
  InvalidTokenTypeError,
  isSwapTransaction,
  isTransferTransaction,
  SignedTransaction,
  Swap,
  SwapTransition,
  TokenType,
  Transaction,
  Transfer,
  TransferTransition,
} from '../types'
import { PIGI_TOKEN_TYPE, UNI_TOKEN_TYPE } from '../index'

export const abi = new ethers.utils.AbiCoder()

const getTokenType = (tokenType): TokenType => {
  const tokenTypeNumber: number = +tokenType
  if (
    tokenTypeNumber !== UNI_TOKEN_TYPE &&
    tokenTypeNumber !== PIGI_TOKEN_TYPE
  ) {
    throw new InvalidTokenTypeError(tokenTypeNumber)
  }
  return tokenTypeNumber
}

const transferAbiTypes = [
  'bytes32',
  'uint32',
  'uint32',
  'bool',
  'uint32',
  'bytes',
]

/**
 * Creates a Transfer from an ABI-encoded Transfer.
 * @param abiEncoded The ABI-encoded Transfer.
 * @returns the Transfer.
 */
export const parseTransferFromABI = (abiEncoded: string): Transfer => {
  const [sender, recipient, tokenType, amount] = abi.decode(
    transferAbiTypes,
    abiEncoded
  )
  return {
    sender,
    recipient,
    tokenType: getTokenType(tokenType),
    amount,
  }
}

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

const swapAbiTypes = ['address', 'bool', 'uint32', 'uint32', 'uint']
/**
 * Creates a Swap from an ABI-encoded Swap.
 * @param abiEncoded The ABI-encoded Swap.
 * @returns the Swap.
 */
export const parseSwapFromABI = (abiEncoded: string): Swap => {
  const [sender, tokenType, inputAmount, minOutputAmount, timeout] = abi.decode(
    swapAbiTypes,
    abiEncoded
  )

  return {
    sender,
    tokenType: getTokenType(tokenType),
    inputAmount,
    minOutputAmount,
    timeout,
  }
}

/**
 * @returns the abi encoded Swap.
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

const signedTransactionAbiTypes = ['bytes', 'bytes']
/**
 * Creates a SignedTransaction from an ABI-encoded SignedTransaction.
 * @param abiEncoded The ABI-encoded SignedTransaction.
 * @returns the SignedTransaction.
 */
export const parseSignedTransactionFromABI = (
  abiEncoded: string
): SignedTransaction => {
  const [signature, tx] = abi.decode(signedTransactionAbiTypes, abiEncoded)

  return {
    signature,
    transaction: parseTransactionFromABI(tx),
  }
}

/**
 * @returns the abi encoded SignedTransaction.
 */
export const abiEncodeSignedTransaction = (
  signedTransaction: SignedTransaction
): string => {
  return abi.encode(signedTransactionAbiTypes, [
    signedTransaction.signature,
    abiEncodeTransaction(signedTransaction.transaction),
  ])
}

const swapTransitionAbiTypes = [
  'bytes32',
  'uint32',
  'uint32',
  'bool',
  'uint32',
  'uint32',
  'uint',
  'bytes',
]

/**
 * Creates a SwapTransition from an ABI-encoded SwapTransition.
 * @param encoded The ABI-encoded SwapTransition.
 * @returns the SwapTransition.
 */
export const parseSwapTransitionFromABI = (encoded: string): SwapTransition => {
  const [
    stateRoot,
    senderSlot,
    recipientSlot,
    tokenType,
    inputAmount,
    minOutputAmount,
    timeout,
    signature,
  ] = abi.decode(swapTransitionAbiTypes, encoded)

  return {
    stateRoot,
    senderSlot,
    recipientSlot,
    tokenType: getTokenType(tokenType),
    inputAmount,
    minOutputAmount,
    timeout,
    signature,
  }
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

const transferTransitionAbiTypes = [
  'bytes32',
  'uint32',
  'uint32',
  'bool',
  'uint32',
  'bytes',
]

/**
 * Creates a TransferTransition from an ABI-encoded TransferTransition.
 * @param encoded The ABI-encoded TransferTransition.
 * @returns the TransferTransition.
 */
export const parseTransferTransitionFromABI = (
  encoded: string
): TransferTransition => {
  const [
    stateRoot,
    senderSlot,
    recipientSlot,
    tokenType,
    amount,
    signature,
  ] = abi.decode(transferTransitionAbiTypes, encoded)

  return {
    stateRoot,
    senderSlot,
    recipientSlot,
    tokenType: getTokenType(tokenType),
    amount,
    signature,
  }
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

const createAndTransferTransitionAbiTypes = [
  'bytes32',
  'uint32',
  'uint32',
  'address',
  'bool',
  'uint32',
  'bytes',
]

/**
 * Creates a CreateAndTransferTransition from an ABI-encoded CreateAndTransferTransition.
 * @param encoded The ABI-encoded CreateAndTransferTransition.
 * @returns the CreateAndTransferTransition.
 */
export const parseCreateAndTransferTransitionFromABI = (
  encoded: string
): CreateAndTransferTransition => {
  const [
    stateRoot,
    senderSlot,
    recipientSlot,
    createdAccountPubkey,
    tokenType,
    amount,
    signature,
  ] = abi.decode(createAndTransferTransitionAbiTypes, encoded)
  return {
    stateRoot,
    senderSlot,
    recipientSlot,
    createdAccountPubkey,
    tokenType: getTokenType(tokenType),
    amount,
    signature,
  }
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

/**
 * Parses the provided ABI-encoded transaction into a Transaction
 * @param tx The ABI-encoded string.
 * @returns the parsed Transaction
 */
export const parseTransactionFromABI = (tx: string): Transaction => {
  try {
    return parseTransferFromABI(tx)
  } catch (err) {
    // If it's not a transfer, it must be a swap
    return parseSwapFromABI(tx)
  }
}
