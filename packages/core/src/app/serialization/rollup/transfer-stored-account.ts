/* Internal Imports */
import { abi } from '../../../app'
import { AbiEncodable } from '../../../types'

/**
 * Creates a TransferStoredAccount from an encoded TransferStoredAccount.
 * @param encoded The encoded TransferStoredAccount.
 * @returns the TransferStoredAccount.
 */
const fromEncoded = (encoded: string): AbiTransferStoredAccountTx => {
  const decoded = abi.decode(AbiTransferStoredAccountTx.abiTypes, encoded)
  return new AbiTransferStoredAccountTx(decoded[0], decoded[1], decoded[2], + decoded[3], decoded[4])
}

/**
 * Represents a basic abi encodable TransferStoredAccount
 */
export class AbiTransferStoredAccountTx implements AbiEncodable {
  public static abiTypes = ['bytes', 'uint32', 'uint32', 'bool', 'uint32']

  constructor(
    readonly signature: string,
    readonly senderSlot: number,
    readonly recipientSlot: number,
    readonly tokenType: number,
    readonly amount: number,
  ) {
    // Attempt to encode to verify input is correct
    this.encoded
  }

  /**
   * @returns the abi encoded TransferStoredAccount.
   */
  get encoded(): string {
    return abi.encode(AbiTransferStoredAccountTx.abiTypes, [
      this.signature,
      this.senderSlot,
      this.recipientSlot,
      this.tokenType,
      this.amount,
    ])
  }

  /**
   * @returns the jsonified AbiTransferStoredAccountTx.
   */
  get jsonified(): any {
    return {
      signature: this.signature,
      senderSlot: this.senderSlot,
      recipientSlot: this.recipientSlot,
      tokenType: this.tokenType,
      amount: this.amount,
    }
  }

  /**
   * Casts a value to a TransferStoredAccount.
   * @param value Thing to cast to a TransferStoredAccount.
   * @returns the TransferStoredAccount.
   */
  public static from(value: string): AbiTransferStoredAccountTx {
    if (typeof value === 'string') {
      return fromEncoded(value)
    }

    throw new Error('Got invalid argument type when casting to TransferStoredAccount.')
  }
}
