/* External Imports */
import BigNum = require('bn.js')
import debug from 'debug'
const log = debug('info:state-update')

/* Internal Imports */
import { abi, hexStringify, GenericMerkleIntervalTreeNode } from '..'
import { AbiEncodable } from '../../types'

/**
 * Creates a AbiAssetTreeNode from an encoded AbiAssetTreeNode.
 * @param encoded The encoded AbiAssetTreeNode.
 * @returns the AbiAssetTreeNode.
 */
const fromEncoded = (encoded: string): AbiAssetTreeNode => {
  const decoded = abi.decode(AbiAssetTreeNode.abiTypes, encoded)
  const hash = Buffer.from(decoded[0], 'hex')
  const lowerBound = Buffer.from(decoded[1], 'hex')
  return new AbiAssetTreeNode(hash, lowerBound)
}

/**
 * Represents a basic abi encodable AbiAssetTreeNode
 */
export class AbiAssetTreeNode extends GenericMerkleIntervalTreeNode
  implements AbiEncodable {
  public static abiTypes = ['bytes32', 'uint256']

  /**
   * @returns the abi encoded AbiAssetTreeNode.
   */
  get encoded(): string {
    return abi.encode(AbiAssetTreeNode.abiTypes, [
      hexStringify(this.hash),
      hexStringify(this.lowerBound),
    ])
  }

  /**
   * @returns the jsonified AbiAssetTreeNode.
   */
  get jsonified(): any {
    return {
      hashValue: hexStringify(this.hash),
      lowerBound: hexStringify(this.lowerBound),
    }
  }

  /**
   * Casts a value to a AbiAssetTreeNode.
   * @param value Thing to cast to a AbiAssetTreeNode.
   * @returns the AbiAssetTreeNode.
   */
  public static from(value: string): AbiAssetTreeNode {
    if (typeof value === 'string') {
      return fromEncoded(value)
    }

    throw new Error('Got invalid argument type when casting to AbiStateUpdate.')
  }

  /**
   * Determines if this AbiAssetTreeNode equals another.
   * @param other Object to compare to.
   * @returns `true` if the two are equal, `false` otherwise.
   */
  public equals(other: AbiAssetTreeNode): boolean {
    return this.encoded === other.encoded
  }
}
