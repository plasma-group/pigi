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
  const tree = getNewSMT(treeHeight)
  for (let i = 0; i < dataBlocks.length; i++) {
    await tree.update(new BigNumber(i, 10), dataBlocks[i])
  }
  return tree
}

function getNewSMT(treeHeight: number): SparseMerkleTreeImpl {
  return new SparseMerkleTreeImpl(
    new BaseDB(new MemDown('') as any, 256),
    undefined,
    treeHeight
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

  describe('verify()', async () => {
    it('should verify all the nodes of trees at various heights', async () => {
      const numDifferentTrees = 5
      // Create trees of multiple sizes tree
      for (let i = 1; i < numDifferentTrees + 1; i++) {
        // Create the block we'll prove inclusion for
        const block = []
        // Populate the block
        for (let j = 1; j < i + 1; j++) {
          block.push(makeRepeatedBytes('' + j, 32))
        }
        const bufBlock = block.map((data) => hexStrToBuf(data))
        // Create a local tree
        const tree = await createSMTfromDataBlocks(bufBlock)
        // Get the root
        const root: Buffer = await tree.getRootHash()

        // Now let's set the root in the contract
        await rollupMerkleUtils.setMerkleRoot(bufToHexString(root))
        // Now that the root is set, let's try verifying all thhe nodes
        for (let j = 0; j < block.length; j++) {
          const indexOfNode = j
          // Generate an inclusion proof
          const inclusionProof = await tree.getMerkleProof(
            new BigNumber(indexOfNode),
            bufBlock[indexOfNode]
          )
          // Extract the values we need for the proof in the form we need them
          const path = bufToHexString(inclusionProof.key.toBuffer('B', 32))
          // Extract the siblings but reverse the order (reversed order is what is expected by the contract
          // which verifies bottom to top as opposed to top to bottom.
          const siblings = inclusionProof.siblings
            .map((sibBuf) => bufToHexString(sibBuf))
            .reverse()
          const isValid = await rollupMerkleUtils.verify(
            bufToHexString(inclusionProof.rootHash),
            bufToHexString(inclusionProof.value),
            path,
            siblings
          )
          // Make sure that the verification was successful
          isValid.should.equal(true)
        }
      }
    }).timeout(100000000)
  })
})
