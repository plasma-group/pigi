/* External Imports */
import BigNum = require('bn.js')
import { abi, keccak256 } from '@pigi/utils'

/* Internal Imports */
import { Transaction, Range, AbiStateObject, EcdsaSignature } from '../../../interfaces/data-types'

/**
 * Creates a Transaction from an encoded Transaction.
 * @param encoded The encoded Transaction.
 * @returns the Transaction.
 */
const fromEncoded = (encoded: string): OwnershipTransaction => {
  const decoded = abi.decode(OwnershipTransaction.abiTypes, encoded)
  return new OwnershipTransaction(
    decoded[0],
    decoded[1],
    { start: decoded[2], end: decoded[3] },
    decoded[4],
    decoded[5],
    { v: decoded[6], r: decoded[7], s: decoded[8] }
  )
}

/**
 * Represents an Ownership transaction
 */
export class OwnershipTransaction implements Transaction {
  public static abiTypes = ['address', 'uint64', 'uint128', 'uint128', 'bytes1', 'bytes', 'bytes32', 'bytes32', 'bytes1']

  constructor(
    readonly plasmaContract: string,
    readonly block: number,
    readonly range: Range,
    readonly methodId: string,
    readonly parameters: { newStateObject: AbiStateObject },
    readonly witness: EcdsaSignature
  ) {}

  /**
   * @returns the encoded transaction.
   */
  get encoded(): string {
    return abi.encode(OwnershipTransaction.abiTypes, [
      this.plasmaContract,
      this.block,
      '0x' + this.range.start.toString('hex'),
      '0x' + this.range.end.toString('hex'),
      this.methodId,
      this.parameters.newStateObject.encoded,
      this.witness.v,
      this.witness.r,
      this.witness.s,
    ])
  }

  /**
   * Casts a value to a Transaction.
   * @param value Thing to cast to a Transaction.
   * @returns the Transaction.
   */
  public static from(value: string): Transaction {
    if (typeof value === 'string') {
      return fromEncoded(value)
    }

    throw new Error('Got invalid argument type when casting to Transaction.')
  }
}
