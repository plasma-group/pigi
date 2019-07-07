/* External Imports */
import BigNum = require('bn.js')
import debug from 'debug'
const log = debug('info:state-update')

/* Internal Imports */
import { abi, hexStringify } from '../../app'
import {
  DoubleMerkleInclusionProof,
  MerkleIntervalInclusionProof,
} from '../../types'

// NOTE ON THIS CLASS: since we want to redo serialization, I chose not to mess with
// abi encoding these objects, and just pulling the jsonified object which can
// be given to ethers.js out.  We can fix this when the rest of serialization
// is handled.

export class AbiStateUpdateInclusionProof
  implements DoubleMerkleInclusionProof {
  public static abiTypes = ['bytes', 'bytes', 'uint256', 'address']
  public stateTreeInclusionProof: MerkleIntervalInclusionProof
  public assetTreeInclusionProof: MerkleIntervalInclusionProof
  constructor(_proof: DoubleMerkleInclusionProof) {
    this.stateTreeInclusionProof = _proof.stateTreeInclusionProof
    this.assetTreeInclusionProof = _proof.assetTreeInclusionProof
  }

  /**
   * @returns the jsonified AbiStateUpdateInclusionProof.
   */
  get jsonified(): any {
    const jsonifiedStatesubtreeInclusionProof = []
    for (let i = 0; i < this.stateTreeInclusionProof.siblings.length; i++) {
      const sibling = this.stateTreeInclusionProof.siblings[i]
      jsonifiedStatesubtreeInclusionProof[i] = {
        hashValue: hexStringify(sibling.hash),
        lowerBound: hexStringify(sibling.lowerBound),
      }
    }

    const jsonifiedAssetTreeInclusionProof = []
    for (let i = 0; i < this.assetTreeInclusionProof.siblings.length; i++) {
      const sibling = this.assetTreeInclusionProof.siblings[i]
      jsonifiedAssetTreeInclusionProof[i] = {
        hashValue: hexStringify(sibling.hash),
        lowerBound: hexStringify(sibling.lowerBound),
      }
    }

    return {
      stateTreeInclusionProof: {
        stateLeafPosition: hexStringify(
          this.stateTreeInclusionProof.leafPosition
        ),
        siblings: jsonifiedStatesubtreeInclusionProof,
      },
      assetTreeInclusionProof: {
        assetLeafPosition: hexStringify(
          this.assetTreeInclusionProof.leafPosition
        ),
        siblings: jsonifiedAssetTreeInclusionProof,
      },
    }
  }
}
