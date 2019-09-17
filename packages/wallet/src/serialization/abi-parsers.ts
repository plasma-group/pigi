import {
  CreateAndTransferTransition,
  InvalidTokenTypeError,
  SignedTransaction,
  Swap,
  SwapTransition,
  TokenType,
  Transaction,
  Transfer,
  TransferTransition,
} from '../types'
import { PIGI_TOKEN_TYPE, UNI_TOKEN_TYPE } from '../index'
import {
  abi,
  createAndTransferTransitionAbiTypes,
  signedTransactionAbiTypes,
  swapAbiTypes,
  swapTransitionAbiTypes,
  transferAbiTypes,
  transferTransitionAbiTypes,
} from './common'

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
    timeout: +timeout,
  }
}

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
 * Parses the provided ABI-encoded transaction into a Transaction
 * @param tx The ABI-encoded string.
 * @returns the parsed Transaction
 */
export const parseTransactionFromABI = (tx: string): Transaction => {
  try {
    return parseSwapFromABI(tx)
  } catch (err) {
    // If it's not a swap, it must be a transfer
    return parseTransferFromABI(tx)
  }
}
