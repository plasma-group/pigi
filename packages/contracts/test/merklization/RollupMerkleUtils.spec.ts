import '../setup'

/* Internal Imports */
import { Transition, makeRepeatedBytes } from '../helpers'

/* External Imports */
import {
  createMockProvider,
  deployContract,
  link,
  getWallets,
} from 'ethereum-waffle'
import {
  keccak256,
  hexStrToBuf,
  bufToHexString,
  BigNumber,
  BaseDB,
  SparseMerkleTreeImpl,
} from '@pigi/core'
import MemDown from 'memdown'

/* Contract Imports */
import * as RollupMerkleUtils from '../../build/RollupMerkleUtils.json'

/* Logging */
import debug from 'debug'
const log = debug('test:info:merkle-utils')

async function createSMTfromDataBlocks(
  dataBlocks: Buffer[]
): Promise<SparseMerkleTreeImpl> {
  const treeHeight = Math.ceil(Math.log2(dataBlocks.length)) + 1
  log('Creating tree of height:', treeHeight)
  const tree = new SparseMerkleTreeImpl(
    new BaseDB(new MemDown('') as any, 256),
    undefined,
    treeHeight
  )
  for (let i = 0; i < dataBlocks.length; i++) {
    await tree.update(new BigNumber(i, 10), dataBlocks[i])
  }
  return tree
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
      await rollupMerkleUtils.getMerkleRoot(['0x1234', '0x4321'])
      // Did not throw... success!
    })

    it('should produce a correct merkle tree with two leaves', async () => {
      const block = ['0x1234', '0x4321']
      const bufBlock = block.map((data) => hexStrToBuf(data))
      // Create the Solidity tree, returning the root
      const result = await rollupMerkleUtils.getMerkleRoot(block)
      // Create a local tree
      const tree = await createSMTfromDataBlocks(bufBlock)
      // Get the root
      const root: Buffer = await tree.getRootHash()
      // Compare!
      result.should.equal(bufToHexString(root))
    })

    it('should produce a correct sparse merkle tree with three leaves', async () => {
      const block = ['0x1234', '0x4321', '0x0420']
      const bufBlock = block.map((data) => hexStrToBuf(data))
      // Create the Solidity tree, returning the root
      const result = await rollupMerkleUtils.getMerkleRoot(block)
      // Create a local tree
      const tree = await createSMTfromDataBlocks(bufBlock)
      // Get the root
      const root: Buffer = await tree.getRootHash()
      // Compare!
      result.should.equal(bufToHexString(root))
    })

    it('should produce correct merkle trees with leaves ranging from 1 to 10', async () => {
      for (let i = 1; i < 10; i++) {
        const block = []
        for (let j = 0; j < i; j++) {
          block.push(
            makeRepeatedBytes('' + Math.floor(Math.random() * 500 + 1), 32)
          )
        }
        const bufBlock = block.map((data) => hexStrToBuf(data))
        // Create the Solidity tree, returning the root
        const result = await rollupMerkleUtils.getMerkleRoot(block)
        // Create a local tree
        const tree = await createSMTfromDataBlocks(bufBlock)
        // Get the root
        const root: Buffer = await tree.getRootHash()
        // Compare!
        result.should.equal(bufToHexString(root))
      }
    })
  })

  // describe.skip('verifyInclusionProof()', async () => {
  //   it('should verify all inclusion proofs for trees of various sizes', async () => {
  //     // Create trees of multiple sizes
  //     const maxTestedTreeSize = 7
  //     for (let i = 1; i < maxTestedTreeSize; i++) {
  //       const block = []
  //       // Populate the block
  //       for (let j = 1; j < i; j++) {
  //         block.push(makeRepeatedBytes('' + j, 32))
  //       }
  //       // Generate leaves
  //       const leaves = block.map((transition) =>
  //         keccak256(hexStrToBuf(transition))
  //       )
  //       // Create a local tree
  //       const tree = new RollupMerkleTree(leaves, keccak256)
  //       const root: Buffer = tree.getRoot()
  //       // Verify inclusion proofs for all the leaves
  //       for (const leaf of leaves) {
  //         const proof = tree.getRollupProof(leaf)
  //         // Actually check if the proof verifies
  //         const result = await rollupMerkleUtils.verify(
  //           bufToHexString(root),
  //           leaf,
  //           proof.path,
  //           proof.siblings
  //         )
  //         // Make sure the verification was successful
  //         result.should.equal(true)
  //       }
  //     }
  //   })
  // })
})
