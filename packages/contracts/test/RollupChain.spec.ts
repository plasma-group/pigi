import './setup'

/* Internal Imports */
import {
  RollupMerkleTree,
  Transition,
  abiEncodeTransition,
  getEncodedTransition,
  generateNTransitions,
  getTransition,
  RollupBlock,
} from './helpers'

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
import * as RollupChain from '../build/RollupChain.json'
import * as RollupMerkleUtils from '../build/RollupMerkleUtils.json'

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

  describe('checkTransitionIncluded() ', async () => {
    it('should verify some simple included transitions', async () => {
      const numTransitions = 10
      const transitions = generateNTransitions(numTransitions)
      // Create a block from them, encoded, and calculate leaves
      const block = new RollupBlock(transitions, 0)
      // Actually submit the block
      await rollupChain.submitBlock(block.encodedTransitions)
      // Now check that each one was included
      for (let i = 0; i < numTransitions; i++) {
        const inclusionProof = block.getInclusionProof(i)
        const isIncluded = await rollupChain.checkTransitionInclusion({
          transition: block.transitions[i],
          inclusionProof,
        })
        // Make sure it was included!
        isIncluded.should.equal(true)
      }
    })
  })
})
