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
import { keccak256, abi, hexStrToBuf, bufToHexString } from '@pigi/core'

/* Contract Imports */
import * as RollupMerkleUtils from '../build/RollupMerkleUtils.json'

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
    const exampleTransition: Transition = {
      transaction: '0x1234',
      postState: '0x' + '00'.repeat(32),
    }
    const encodedTransition = bufToHexString(
      abiEncodeTransition(exampleTransition)
    )
    it('should not throw', async () => {
      await rollupMerkleUtils.getMerkleRoot([
        encodedTransition,
        encodedTransition,
      ])
      // Did not throw... success!
    })
    it('should produce a correct merkle tree with two leaves', async () => {
      // Create the block with two transitions
      const block = [encodedTransition, encodedTransition]
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
        const block = Array(i).fill(encodedTransition)
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
})
