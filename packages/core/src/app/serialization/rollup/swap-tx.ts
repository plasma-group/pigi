/* Internal Imports */
import { abi } from '../../../app'
import { AbiEncodable } from '../../../types'

/**
 * Creates a TransferNewAccountTx from an encoded TransferNewAccountTx.
 * @param encoded The encoded TransferNewAccountTx.
 * @returns the TransferNewAccountTx.
 */
const fromEncoded = (encoded: string): AbiSwapTx => {
  const decoded = abi.decode(AbiSwapTx.abiTypes, encoded)
  return new AbiSwapTx(decoded[0], decoded[1], decoded[2], + decoded[3], decoded[4], decoded[5], decoded[6])
}

/**
 * Represents a basic abi encodable TransferNewAccountTx
 */
export class AbiSwapTx implements AbiEncodable {
  public static abiTypes = ['bytes', 'uint32', 'uint32', 'bool', 'uint32', 'uint32', 'uint']

  // [sig: Signature, sender: StorageSlot, tokenType: uint, uint32 inputAmount, uint32 minOutputAmount, uint timeout]

  constructor(
    readonly signature: string,
    readonly senderSlot: number,
    readonly recipientSlot: number,
    readonly tokenType: number,
    readonly inputAmount: number,
    readonly minOutputAmount: number,
    readonly timeout: number,
  ) {
    // Attempt to encode to verify input is correct
    this.encoded
  }

  /**
   * @returns the abi encoded TransferNewAccountTx.
   */
  get encoded(): string {
    return abi.encode(AbiSwapTx.abiTypes, [
      this.signature,
      this.senderSlot,
      this.recipientSlot,
      this.tokenType,
      this.inputAmount,
      this.minOutputAmount,
      this.timeout,
    ])
  }

  /**
   * @returns the jsonified AbiSwapTx.
   */
  get jsonified(): any {
    return {
      signature: this.signature,
      senderSlot: this.senderSlot,
      recipientSlot: this.recipientSlot,
      tokenType: this.tokenType,
      inputAmount: this.inputAmount,
      minOutputAmount: this.minOutputAmount,
      timeout: this.timeout,
    }
  }

  /**
   * Casts a value to a TransferNewAccountTx.
   * @param value Thing to cast to a TransferNewAccountTx.
   * @returns the TransferNewAccountTx.
   */
  public static from(value: string): AbiSwapTx {
    if (typeof value === 'string') {
      return fromEncoded(value)
    }

    throw new Error('Got invalid argument type when casting to TransferNewAccountTx.')
  }
}
