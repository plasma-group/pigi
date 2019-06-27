/* External Imports */
import BigNum = require('bn.js')
import debug from 'debug'
const log = debug('info:state-update')

/* Internal Imports */
import { abi, hexStringify, GenericMerkleIntervalTreeNode } from '..'
import { MerkleIntervalTreeNode, AbiEncodable } from '../../types'

/**
 * Creates a AbiStateSubtreeNode from an encoded AbiStateSubtreeNode.
 * @param encoded The encoded AbiStateSubtreeNode.
 * @returns the AbiStateSubtreeNode.
 */
const fromEncoded = (encoded: string): AbiStateSubtreeNode => {
  const decoded = abi.decode(AbiStateSubtreeNode.abiTypes, encoded)
  const hash = Buffer.from(decoded[0], 'hex')
  const lowerBound = Buffer.from(decoded[1], 'hex')
  return new AbiStateSubtreeNode(hash, lowerBound)
}

/**
 * Represents a basic abi encodable AbiStateSubtreeNode
 */
export class AbiStateSubtreeNode extends GenericMerkleIntervalTreeNode
  implements AbiEncodable {
  public static abiTypes = ['bytes32', 'uint128']

  /**
   * @returns the abi encoded AbiStateSubtreeNode.
   */
  get encoded(): string {
    return abi.encode(AbiStateSubtreeNode.abiTypes, [
      hexStringify(this.hash),
      hexStringify(this.lowerBound),
    ])
  }

  /**
   * @returns the jsonified AbiStateSubtreeNode.
   */
  get jsonified(): any {
    return {
      hashValue: hexStringify(this.hash),
      lowerBound: hexStringify(this.lowerBound),
    }
  }

  /**
   * Casts a value to a AbiStateSubtreeNode.
   * @param value Thing to cast to a AbiStateSubtreeNode.
   * @returns the AbiStateSubtreeNode.
   */
  public static from(value: string): AbiStateSubtreeNode {
    if (typeof value === 'string') {
      return fromEncoded(value)
    }

    throw new Error('Got invalid argument type when casting to AbiStateUpdate.')
  }

  /**
   * Determines if this AbiStateSubtreeNode equals another.
   * @param other Object to compare to.
   * @returns `true` if the two are equal, `false` otherwise.
   */
  public equals(other: AbiStateSubtreeNode): boolean {
    return this.encoded === other.encoded
  }
}
