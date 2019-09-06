import '../setup'

/* Internal Imports */
import {
  RollupMerkleTree,
  Transition,
  abiEncodeTransition,
  getEncodedTransition,
  generateNTransitions,
  getTransition,
  RollupBlock,
} from '../helpers'

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
import * as RollupChain from '../../build/RollupChain.json'
import * as RollupMerkleUtils from '../../build/RollupMerkleUtils.json'

/* Begin tests */
describe('RollupChain', () => {
  const provider = createMockProvider()
  const [wallet1] = getWallets(provider)
  let rollupChain
  let rollupMerkleUtils

  /* Link libraries before tests */
  before(async () => {
    rollupMerkleUtils = await deployContract(wallet1, RollupMerkleUtils, [], {
      gasLimit: 6700000,
    })
    // Link attaches the library to the RollupChain contract.
    link(
      RollupChain,
      // NOTE: This path is in relation to `waffle-config.json`
      'contracts/RollupMerkleUtils.sol:RollupMerkleUtils',
      rollupMerkleUtils.address
    )
  })

  /* Deploy a new RollupChain before each test */
  beforeEach(async () => {
    rollupChain = await deployContract(wallet1, RollupChain, [], {
      gasLimit: 6700000,
    })
  })

  describe('submitBlock() ', async () => {
    it('should not throw', async () => {
      await rollupChain.submitBlock([
        getEncodedTransition('0'),
        getEncodedTransition('1'),
      ])
      // Did not throw... success!
    })
  })

  // TODO: Enable these tests once we have a working SMT implementation
  describe.skip('checkTransitionIncluded()', async () => {
    it('should verify n included transitions for the first block', async () => {
      // Create a block from them, encoded, and calculate leaves
      const block = new RollupBlock(generateNTransitions(10), 0)
      // Actually submit the block
      await rollupChain.submitBlock(block.encodedTransitions)
      // Now check that each one was included
      for (let i = 0; i < block.leaves.length; i++) {
        const inclusionProof = block.getInclusionProof(i)
        const isIncluded = await rollupChain.checkTransitionInclusion({
          transition: block.transitions[i],
          inclusionProof,
        })
        // Make sure it was included!
        isIncluded.should.equal(true)
      }
    })

    it('should verify n included transitions for the second block', async () => {
      const block0 = new RollupBlock(generateNTransitions(5), 0)
      const block1 = new RollupBlock(generateNTransitions(5), 1)
      // Submit the blocks
      await rollupChain.submitBlock(block0.encodedTransitions)
      await rollupChain.submitBlock(block1.encodedTransitions)
      // Now check that all transitions for the 2nd block were included
      for (let i = 0; i < block1.leaves.length; i++) {
        const inclusionProof = block1.getInclusionProof(i)
        const isIncluded = await rollupChain.checkTransitionInclusion({
          transition: block1.transitions[i],
          inclusionProof,
        })
        // Make sure it was included!
        isIncluded.should.equal(true)
      }
    })

    it('should fail to verify inclusion for a transition which is not included', async () => {
      const block0 = new RollupBlock(generateNTransitions(5), 0)
      // Submit the blocks
      await rollupChain.submitBlock(block0.encodedTransitions)
      // Now check that we don't return true if a transition shouldn't have been included
      const notIncluded = getTransition('deadbeefdeadbeefdeadbeef')
      const res = await rollupChain.checkTransitionInclusion({
        transition: notIncluded,
        inclusionProof: {
          blockNumber: 0,
          transitionIndex: 0,
          path: 0,
          siblings: ['0x' + '00'.repeat(32)],
        }
      })
      res.should.equal(false)
    })
  })
})
