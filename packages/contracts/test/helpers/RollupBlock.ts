/* Internal Imports */
import {
  RollupMerkleTree,
  Transition,
} from '.'

/* External Imports */
import { keccak256, abi, hexStrToBuf, bufToHexString } from '@pigi/core'

type Tx = string

interface TransitionInclusionProof {
  blockNumber: number
  transitionIndex: number
  path: string
  siblings: string[]
}

interface IncludedTransition {
  transition: Transition
  inclusionProof: TransitionInclusionProof
}

/*
 * Helper class which provides all information requried for a particular
 * Rollup block. This includes all of the tranisitions in readable form
 * as well as the merkle tree which it generates.
 */
export class RollupBlock {
  public transitions: Transition[]
  public leaves: Buffer[]
  public blockNumber: number
  public tree: RollupMerkleTree

  constructor(transitions: Transition[], blockNumber: number) {
    this.transitions = transitions
    this.leaves = this.transitions.map((transition) =>
      keccak256(hexStrToBuf(transition))
    )
    this.blockNumber = blockNumber
    this.tree = new RollupMerkleTree(this.leaves, keccak256)
  }

  public getIncludedTransition(transitionIndex: number): IncludedTransition {
    const inclusionProof = this.getInclusionProof(transitionIndex)
    return {
      transition: this.transitions[transitionIndex],
      inclusionProof,
    }
  }

  public getInclusionProof(transitionIndex: number): TransitionInclusionProof {
    const blockInclusion = this.tree.getRollupProof(
      this.leaves[transitionIndex]
    )
    return {
      blockNumber: this.blockNumber,
      transitionIndex,
      path: blockInclusion.path,
      siblings: blockInclusion.siblings,
    }
  }
}
