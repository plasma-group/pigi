/* Internal Imports */
import { abi } from '../../app'
import { AbiEncodable } from '../../types'

/**
 * Creates a TransferNewAccountTx from an encoded TransferNewAccountTx.
 * @param encoded The encoded TransferNewAccountTx.
 * @returns the TransferNewAccountTx.
 */
const fromEncoded = (encoded: string): AbiTransferNewAccountTx => {
  const decoded = abi.decode(AbiTransferNewAccountTx.abiTypes, encoded)
  return new AbiTransferNewAccountTx(decoded[0], decoded[1], decoded[2], decoded[3], decoded[4], decoded[5])
}

/**
 * Represents a basic abi encodable TransferNewAccountTx
 */
export class AbiTransferNewAccountTx implements AbiEncodable {
  public static abiTypes = ['bytes', 'address', 'uint32', 'uint32', 'bool', 'uint32']

  constructor(
    readonly signature: string,
    readonly newAccountAddress: string,
    readonly sender: string,
    readonly recipient: string,
    readonly tokenType: string,
    readonly amount: string,
  ) {
    // Attempt to encode to verify input is correct
    this.encoded
  }

  /**
   * @returns the abi encoded TransferNewAccountTx.
   */
  get encoded(): string {
    return abi.encode(AbiTransferNewAccountTx.abiTypes, [
      this.signature,
      this.newAccountAddress,
      this.sender,
      this.recipient,
      this.tokenType,
      this.amount,
    ])
  }

  /**
   * @returns the jsonified AbiTransferNewAccountTx.
   */
  get jsonified(): any {
    return {
      signature: this.signature,
      newAccountAddress: this.newAccountAddress,
      sender: this.sender,
      recipient: this.recipient,
      tokenType: this.tokenType,
      amount: this.amount,
    }
  }

  /**
   * Casts a value to a TransferNewAccountTx.
   * @param value Thing to cast to a TransferNewAccountTx.
   * @returns the TransferNewAccountTx.
   */
  public static from(value: string): AbiTransferNewAccountTx {
    if (typeof value === 'string') {
      return fromEncoded(value)
    }

    throw new Error('Got invalid argument type when casting to TransferNewAccountTx.')
  }
}
