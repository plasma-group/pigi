import './setup'

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

/* Helpers */
interface Transition {
  transaction: string
  postState: string
}

function abiEncodeTransition(transition: Transition): Buffer {
  return hexStrToBuf(
    abi.encode(
      ['bytes', 'bytes32'],
      [transition.transaction, transition.postState]
    )
  )
}

/* Begin tests */
describe.only('RollupChain', () => {
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

  describe('getMerkleRoot() ', async () => {
    const exampleTransition: Transition = {
      transaction: '0x1234',
      postState: '0x' + '00'.repeat(32),
    }
    const encodedTransition = bufToHexString(
      abiEncodeTransition(exampleTransition)
    )
    it('should not throw', async () => {
      await rollupChain.submitBlock([encodedTransition, encodedTransition])
      // Did not throw... success!
    })
    it('should produce a correct merkle tree with two leaves', async () => {
      // Create the block with two transitions
      const block = [encodedTransition, encodedTransition]
      // Create the Solidity tree, returning the root
      const result = await rollupChain.submitBlock(block)
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
        const result = await rollupChain.submitBlock(block)
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
