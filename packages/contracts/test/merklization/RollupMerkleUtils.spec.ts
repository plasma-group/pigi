import '../setup'

/* Internal Imports */
import {
  RollupMerkleTree,
  Transition,
  makeRepeatedBytes,
} from '../helpers'

/* External Imports */
import {
  createMockProvider,
  deployContract,
  link,
  getWallets,
} from 'ethereum-waffle'
import {
  keccak256,
  abi,
  hexStrToBuf,
  bufToHexString,
  BigNumber,
} from '@pigi/core'

/* Contract Imports */
import * as RollupMerkleUtils from '../../build/RollupMerkleUtils.json'

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
        '0x1234',
        '0x4321',
      ])
      // Did not throw... success!
    })

    it('should produce a correct merkle tree with two leaves', async () => {
      // Create the block with two transitions
      const block = ['0x1234', '0x4321']
      // Create the Solidity tree, returning the root
      const result = await rollupMerkleUtils.getMerkleRoot(block)
      // Create a local tree
      const tree = new RollupMerkleTree(
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
        const block = Array(i).fill(makeRepeatedBytes('' + i, 32))
        // Create the Solidity tree, returning the root
        const result = await rollupMerkleUtils.getMerkleRoot(block)
        // Create a local tree
        const tree = new RollupMerkleTree(
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
          block.push(makeRepeatedBytes('' + j, 32))
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
            bufToHexString(root),
            leaf,
            proof.path,
            proof.siblings
          )
          // Make sure the verification was successful
          result.should.equal(true)
        }
      }
    })
  })
})
