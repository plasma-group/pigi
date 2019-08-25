import './setup'

/* Internal Imports */
import { Transition, abiEncodeTransition } from './utils'

/* External Imports */
import {
  createMockProvider,
  deployContract,
  link,
  getWallets,
} from 'ethereum-waffle'
import { MerkleTree } from 'merkletreejs'
import {
  keccak256,
  abi,
  hexStrToBuf,
  bufToHexString,
  BigNumber,
} from '@pigi/core'

/* Contract Imports */
import * as RollupMerkleUtils from '../build/RollupMerkleUtils.json'

/* Helper */
interface RollupInclusionProof {
  path: string
  siblings: string[]
}

/*
 * Helper class which extends the MerkleTree class in order to
 * provide proofs which conform to what is required to pass to the
 * rollup smart contract.
 */
class RollupMerkleTree extends MerkleTree {
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

// Creates an encoded transition with the specified transaction
function getEncodedTransition(transaction: string): string {
  return bufToHexString(
    abiEncodeTransition({
      transaction: '0x' + transaction,
      postState: '0x' + '00'.repeat(32),
    })
  )
}

/* Begin tests */
describe('RollupMerkleUtils', () => {
  const provider = createMockProvider()
  const [wallet1] = getWallets(provider)
  let rollupMerkleUtils

  /* Deploy RollupMerkleUtils library before tests */
  before(async () => {
    rollupMerkleUtils = await deployContract(wallet1, RollupMerkleUtils, [], {
      gasLimit: 6700000,
    })
  })

  describe('getMerkleRoot() ', async () => {
    it('should not throw', async () => {
      await rollupMerkleUtils.getMerkleRoot([
        getEncodedTransition('1234'),
        getEncodedTransition('4321'),
      ])
      // Did not throw... success!
    })

    it('should produce a correct merkle tree with two leaves', async () => {
      // Create the block with two transitions
      const block = [getEncodedTransition('1234'), getEncodedTransition('4321')]
      // Create the Solidity tree, returning the root
      const result = await rollupMerkleUtils.getMerkleRoot(block)
      // Create a local tree
      const tree = new MerkleTree(
        block.map((transition) => keccak256(hexStrToBuf(transition))),
        keccak256
      )
      const root: Buffer = tree.getRoot()
      // Verify that they are equal
      result.should.equal(bufToHexString(root))
    })

    it('should produce correct merkle trees with leaves ranging from 1 to 10', async () => {
      for (let i = 1; i < 10; i++) {
        // Create the block with `i` transitions
        const block = Array(i).fill(getEncodedTransition('' + i))
        // Create the Solidity tree, returning the root
        const result = await rollupMerkleUtils.getMerkleRoot(block)
        // Create a local tree
        const tree = new MerkleTree(
          block.map((transition) => keccak256(hexStrToBuf(transition))),
          keccak256
        )
        const root: Buffer = tree.getRoot()
        // Verify the roots are are equal
        result.should.equal(bufToHexString(root))
      }
    })
  })

  describe('verifyInclusionProof()', async () => {
    it('should verify all inclusion proofs for trees of various sizes', async () => {
      // Create trees of multiple sizes
      const maxTestedTreeSize = 7
      for (let i = 1; i < maxTestedTreeSize; i++) {
        const block = []
        // Populate the block
        for (let j = 1; j < i; j++) {
          block.push(getEncodedTransition('' + j))
        }
        // Generate leaves
        const leaves = block.map((transition) =>
          keccak256(hexStrToBuf(transition))
        )
        // Create a local tree
        const tree = new RollupMerkleTree(leaves, keccak256)
        const root: Buffer = tree.getRoot()
        // Verify inclusion proofs for all the leaves
        for (const leaf of leaves) {
          const proof = tree.getRollupProof(leaf)
          // Actually check if the proof verifies
          const result = await rollupMerkleUtils.verify(
            proof.path,
            proof.siblings,
            bufToHexString(root),
            leaf
          )
          result.should.equal(true)
        }
      }
    })
  })
})
