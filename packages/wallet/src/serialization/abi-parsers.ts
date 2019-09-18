/* External Imports */
import {getLogger} from "@pigi/core";

/* Internal imports */
import {
  CreateAndTransferTransition,
  InvalidTokenTypeError,
  SignedTransaction, State, StateReceipt,
  Swap,
  SwapTransition,
  TokenType,
  RollupTransaction,
  Transfer,
  TransferTransition, RollupTransition,
} from '../types'
import { PIGI_TOKEN_TYPE, UNI_TOKEN_TYPE } from '../index'
import {
  abi,
  createAndTransferTransitionAbiTypes,
  signedTransactionAbiTypes, stateAbiTypes, stateReceiptAbiTypes,
  swapAbiTypes,
  swapTransitionAbiTypes,
  transferAbiTypes,
  transferTransitionAbiTypes,
} from './common'
import {ethers, utils} from "ethers";

const log = getLogger('abiEncoders')

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
 * Parses the provided ABI-encoded transaction into a RollupTransaction
 * @param abiEncoded The ABI-encoded string.
 * @returns the parsed RollupTransaction.
 */
export const parseTransactionFromABI = (abiEncoded: string): RollupTransaction => {
  try {
    return parseSwapFromABI(abiEncoded)
  } catch (err) {
    // If it's not a swap, it must be a transfer
    return parseTransferFromABI(abiEncoded)
  }
}

/**
 * Parses the provided ABI-encoded transaction into a RollupTransition
 * @param abiEncoded The ABI-encoded string.
 * @returns the parsed RollupTransition.
 */
export const parseTransitionFromABI = (abiEncoded: string): RollupTransition => {
  try {
    return parseSwapTransitionFromABI(abiEncoded)
  } catch (err) {
    try {
      return parseTransferTransitionFromABI(abiEncoded)
    } catch (e) {
      return parseCreateAndTransferTransitionFromABI(abiEncoded)
    }
  }
}

/**
 * Parses the provided ABI-encoded transaction into a State
 * @param abiEncoded The ABI-encoded string.
 * @returns the parsed State.
 */
export const parseStateFromABI = (abiEncoded: string): State => {
  const [
    address,
    uniBalance,
    pigiBalance
  ] = abi.decode(stateAbiTypes, abiEncoded)
  return {
    address,
    balances: {
      [UNI_TOKEN_TYPE]: uniBalance,
      [PIGI_TOKEN_TYPE]: pigiBalance
    }
  }
}

/**
 * Parses the provided ABI-encoded transaction into a StateReceipt
 * @param abiEncoded The ABI-encoded string.
 * @returns the parsed StateReceipt
 */
export const parseStateReceiptFromABI = (abiEncoded: string): StateReceipt => {
  const [
    stateRoot,
    blockNumber,
    transitionIndex,
    leafID,
    inclusionProof,
    state
  ] = abi.decode(stateReceiptAbiTypes, abiEncoded)
  return {
    stateRoot: ethers.utils.parseBytes32String(stateRoot),
    blockNumber: blockNumber.toNumber(),
    transitionIndex: transitionIndex.toNumber(),
    leafID,
    inclusionProof: inclusionProof.map(x => ethers.utils.parseBytes32String(x)),
    state: parseStateFromABI(state)
  }
}

/*********************
 * PRIVATE FUNCTIONS *
 *********************/

const getTokenType = (tokenType): TokenType => {
  const tokenTypeNumber: number = +tokenType
  if (
    tokenTypeNumber !== UNI_TOKEN_TYPE &&
    tokenTypeNumber !== PIGI_TOKEN_TYPE
  ) {
    log.error(`Received invalid token type parsing ABI encoded input -- this should never happen. Token Type: ${tokenType}`)
    throw new InvalidTokenTypeError(tokenTypeNumber)
  }
  return tokenTypeNumber
}

/**
 * Creates a Transfer from an ABI-encoded Transfer.
 * @param abiEncoded The ABI-encoded Transfer.
 * @returns the Transfer.
 */
const parseTransferFromABI = (abiEncoded: string): Transfer => {
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
const parseSwapFromABI = (abiEncoded: string): Swap => {
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
 * Creates a SwapTransition from an ABI-encoded SwapTransition.
 * @param abiEncoded The ABI-encoded SwapTransition.
 * @returns the SwapTransition.
 */
const parseSwapTransitionFromABI = (abiEncoded: string): SwapTransition => {
  const [
    stateRoot,
    senderSlot,
    recipientSlot,
    tokenType,
    inputAmount,
    minOutputAmount,
    timeout,
    signature,
  ] = abi.decode(swapTransitionAbiTypes, abiEncoded)

  return {
    stateRoot,
    senderLeafID: senderSlot,
    uniswapLeafID: recipientSlot,
    tokenType: getTokenType(tokenType),
    inputAmount,
    minOutputAmount,
    timeout,
    signature,
  }
}

/**
 * Creates a TransferTransition from an ABI-encoded TransferTransition.
 * @param abiEncoded The ABI-encoded TransferTransition.
 * @returns the TransferTransition.
 */
const parseTransferTransitionFromABI = (
  abiEncoded: string
): TransferTransition => {
  const [
    stateRoot,
    senderSlot,
    recipientSlot,
    tokenType,
    amount,
    signature,
  ] = abi.decode(transferTransitionAbiTypes, abiEncoded)

  return {
    stateRoot,
    senderLeafID: senderSlot,
    recipientLeafID: recipientSlot,
    tokenType: getTokenType(tokenType),
    amount,
    signature,
  }
}

/**
 * Creates a CreateAndTransferTransition from an ABI-encoded CreateAndTransferTransition.
 * @param abiEncoded The ABI-encoded CreateAndTransferTransition.
 * @returns the CreateAndTransferTransition.
 */
const parseCreateAndTransferTransitionFromABI = (
  abiEncoded: string
): CreateAndTransferTransition => {
  const [
    stateRoot,
    senderSlot,
    recipientSlot,
    createdAccountPubkey,
    tokenType,
    amount,
    signature,
  ] = abi.decode(createAndTransferTransitionAbiTypes, abiEncoded)
  return {
    stateRoot,
    senderLeafID: senderSlot,
    recipientLeafID: recipientSlot,
    createdAccountPubkey,
    tokenType: getTokenType(tokenType),
    amount,
    signature,
  }
}