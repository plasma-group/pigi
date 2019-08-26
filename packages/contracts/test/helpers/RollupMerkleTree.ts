/* External Imports */
import { MerkleTree } from 'merkletreejs'
import { bufToHexString, BigNumber } from '@pigi/core'

export interface RollupInclusionProof {
  path: string
  siblings: string[]
}

/*
 * Helper class which extends the MerkleTree class in order to
 * provide proofs which conform to what is required to pass to the
 * rollup smart contract.
 */
export class RollupMerkleTree extends MerkleTree {
  /*
   * Get the proof which can be passed to the rollup contract.
   */
  public getRollupProof(leaf: any, index?: any): RollupInclusionProof {
    const defaultProof = super.getProof(leaf, index)
    const transformedProof = this.transformInclusionProof(defaultProof)
    return transformedProof
  }

  private transformInclusionProof(
    merkletreejsInclusionProof
  ): RollupInclusionProof {
    let positionBitString = ''
    const siblings = []
    for (const element of merkletreejsInclusionProof) {
      positionBitString += element.position === 'left' ? '1' : '0'
      siblings.push(element.data)
    }
    const positionBits = new BigNumber(
      // Note that we have to reverse the bits because we iterated
      // through the nodes in the opposite order of what the contract expects.
      this.reverse(positionBitString),
      2
    ).toBuffer('B', 32) // Turn the positionBits into a buffer
    return {
      path: bufToHexString(positionBits),
      siblings: siblings.map((sibling) => bufToHexString(sibling)),
    }
  }

  // Helper function which reverse a string
  private reverse(s: string): string {
    return s
      .split('')
      .reverse()
      .join('')
  }
}
