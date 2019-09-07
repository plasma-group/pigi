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
import * as SparseMerkleTreeLib from '../../build/SparseMerkleTreeLib.json'

/* Begin tests */
describe.only('RollupChain', () => {
  const provider = createMockProvider()
  const [wallet1] = getWallets(provider)
  let rollupChain
  let sparseMerkleTree

  /* Link libraries before tests */
  before(async () => {
    sparseMerkleTree = await deployContract(wallet1, SparseMerkleTreeLib, [], {
      gasLimit: 6700000,
    })
    // Link attaches the library to the RollupChain contract.
    link(
      RollupChain,
      // NOTE: This path is in relation to `waffle-config.json`
      'contracts/SparseMerkleTreeLib.sol:SparseMerkleTreeLib',
      sparseMerkleTree.address
    )
  })

  /* Deploy a new RollupChain before each test */
  beforeEach(async () => {
    rollupChain = await deployContract(wallet1, RollupChain, [], {
      gasLimit: 6700000,
    })
  })

  /*
   * Test submitBlock()
   */
  describe('submitBlock() ', async () => {
    it('should not throw', async () => {
      await rollupChain.submitBlock([
        getEncodedTransition('0'),
        getEncodedTransition('1'),
      ])
      // Did not throw... success!
    })
  })

  /*
   * Test verifySequentialTransitions()
   */
  describe('verifySequentialTransitions()', async () => {
    let blocks = []
    // Before each test let's submit a couple blocks
    beforeEach(async () => {
      // Create two blocks from some default transitions
      blocks = [
        new RollupBlock(generateNTransitions(10), 0),
        new RollupBlock(generateNTransitions(10), 1),
      ]
      // Submit the blocks
      await rollupChain.submitBlock(blocks[0].encodedTransitions)
      await rollupChain.submitBlock(blocks[1].encodedTransitions)
    })

    describe('same block', async () => {
      it('should not throw if the transitions are sequential in the same block', async () => {
        const includedTransitions = [
          blocks[0].getIncludedTransition(0),
          blocks[0].getIncludedTransition(1),
        ]
        await rollupChain.verifySequentialTransitions(
          includedTransitions[0],
          includedTransitions[1]
        )
      })

      it('should throw if they are not sequential in the same block', async () => {
        const includedTransitions = [
          blocks[0].getIncludedTransition(0),
          blocks[0].getIncludedTransition(2),
        ]
        try {
          await rollupChain.verifySequentialTransitions(
            includedTransitions[0],
            includedTransitions[1]
          )
        } catch (err) {
          // Success we threw an error!
          return
        }
        throw new Error('Verify sequential should throw when not sequential!')
      })
    })

    describe('different blocks', async () => {
      it('should NOT throw if the transitions are last of prev block & first of next block', async () => {
        const includedTransitions = [
          // Last transition of the first block
          blocks[0].getIncludedTransition(blocks[0].transitions.length - 1),
          // First transition of the next block
          blocks[1].getIncludedTransition(0),
        ]
        await rollupChain.verifySequentialTransitions(
          includedTransitions[0],
          includedTransitions[1]
        )
      })

      it('should throw if the transitions are NOT last of prev block & first of next block', async () => {
        const includedTransitions = [
          blocks[0].getIncludedTransition(0),
          blocks[1].getIncludedTransition(0),
        ]
        try {
          await rollupChain.verifySequentialTransitions(
            includedTransitions[0],
            includedTransitions[1]
          )
        } catch (err) {
          // Success we threw an error!
          return
        }
        throw new Error('Verify sequential should throw when not sequential!')
      })
    })
  })

  /*
   * Test proveTransitionInvalid()
   */
  describe.only('proveTransitionInvalid() ', async () => {
    it('should not throw', async () => {
      // Create a rollup block
      const block = new RollupBlock(generateNTransitions(5), 0)
      // Get two included transitions
      const includedTransitions = [
        block.getIncludedTransition(0),
        block.getIncludedTransition(1),
      ]
      // Generate a dummy storage inclusion proof
      const dummyStorageInclusionProof = {
        siblings: Array(160).fill('0x' + '99'.repeat(32)),
        path: 5
      }
      // Generate Dummy IncludedStorage
      const dummyInputStorage = {
        value: {
          pubkey: '0x' + '00'.repeat(20),
          uniBalance: 20,
          pigiBalance: 120,
        },
        inclusionProof: dummyStorageInclusionProof
      }
      // Call the function and see if it works!
      const res = await rollupChain.proveTransitionInvalid(
        includedTransitions[0],
        includedTransitions[1],
        [dummyInputStorage, dummyInputStorage],
      )
      // Did not throw... success!
    })
  })

  /*
   * Test verifySequentialTransitions()
   *
   * TODO: Enable these tests once we have a working SMT implementation
   */
  describe.skip('checkTransitionIncluded()', async () => {
    it('should verify n included transitions for the first block', async () => {
      // Create a block from some default transitions
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
      // Create two blocks from some default transitions
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
      // Create a block from some default transitions
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
        },
      })
      res.should.equal(false)
    })
  })
})
