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
import {
  keccak256,
  abi,
  hexStrToBuf,
  bufToHexString,
  BigNumber,
} from '@pigi/core'

/* Logging */
import debug from 'debug'
const log = debug('test:info:rollup-chain-manager')


/* Contract Imports */
import * as RollupChain from '../../build/RollupChain.json'
import * as SparseMerkleTreeLib from '../../build/SparseMerkleTreeLib.json'

/* Helpers */
// Create a byte string of some length in bytes. It repeats the value provided until the
// string hits that length
function makeRepeatedBytes(value: string, length: number): string {
  const result = value.repeat(length * 2 / value.length).slice(0, length * 2)
  return '0x' + result
}

// Make padded bytes. Bytes are right padded.
function makePaddedBytes(value: string, length: number): string {
  if (value.length > length) {
    throw new Error('Value too large to fit in ' + length + ' byte string')
  }
  const targetLength = length * 2
  while (value.length < (targetLength || 2)) {value = value + '0'}
  return '0x' + value
}

// Make a padded uint. Uints are left padded.
function makePaddedUint(value: string, length: number): string {
  if (value.length > length) {
    throw new Error('Value too large to fit in ' + length + ' byte string')
  }
  const targetLength = length * 2
  while (value.length < (targetLength || 2)) {value = '0' + value}
  return '0x' + value
}

const ZERO_BYTES32 = makeRepeatedBytes('0', 32)
const ZERO_ADDRESS = makeRepeatedBytes('0', 20)
const ZERO_UINT32 = makeRepeatedBytes('0', 4)
const ZERO_SIGNATURE = makeRepeatedBytes('0', 65)

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
   * Test inferTxType()
   */
  describe('inferTxType() ', async () => {
    const txTypes = {
      NEW_ACCOUNT_TRANSFER_TYPE: 0,
      STORED_ACCOUNT_TRANSFER_TYPE: 1,
      SWAP_TYPE: 2,
    }

    it('should infer a transfer tx to a new account', async () => {
      // Create a tx which we will infer the type of
      const unsignedTx = {
        tokenType: 1,
        recipient: makeRepeatedBytes('01', 20), // address type
        amount: '0x0003232', // some uint32 value
      }
      // Encode!
      const encoded = abi.encode(
        ['uint', 'address', 'uint32'],
        [unsignedTx.tokenType, unsignedTx.recipient, unsignedTx.amount]
      )
      // Attempt to infer the transaction type
      const res = await rollupChain.inferTxType(encoded)
      // Check that it's the correct type
      res.should.equal(txTypes.NEW_ACCOUNT_TRANSFER_TYPE)
    })

    it('should infer a transfer transaction to a stored account', async () => {
      // Create a transaction which we will infer the type of
      const tx = {
        tokenType: 1,
        recipient: '0x00000003', // some uint32 representing a storage slot
        amount: '0x0003232', // some uint32 value
      }
      // Encode!
      const encoded = abi.encode(
        ['uint', 'uint32', 'uint32'],
        [tx.tokenType, tx.recipient, tx.amount]
      )
      // Attempt to infer the transaction type
      const res = await rollupChain.inferTxType(encoded)
      // Check that it's the correct type
      res.should.equal(txTypes.STORED_ACCOUNT_TRANSFER_TYPE)
    })

    it('should infer a transfer transaction to a swap', async () => {
      // Create a transaction which we will infer the type of
      const tx = {
        tokenType: 1,
        inputAmount: '0x0000000000004353',
        minOutputAmount: '0x0000000000004353',
        timeout: makeRepeatedBytes('08', 32),
      }
      // Encode!
      const encoded = abi.encode(
        ['uint', 'bytes8', 'bytes8', 'bytes32'],
        [tx.tokenType, tx.inputAmount, tx.minOutputAmount, tx.timeout]
      )
      // Attempt to infer the transaction type
      const res = await rollupChain.inferTxType(encoded)
      // Check that it's the correct type
      res.should.equal(txTypes.SWAP_TYPE)
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
          siblings: [ZERO_BYTES32],
        },
      })
      res.should.equal(false)
    })
  })

  /*
   * Test applyStoredAccountTransfer()
   */
  describe('applyStoredAccountTransfer() ', async () => {
    const sampleStorage = {
      pubkey: makeRepeatedBytes('48', 20),
      balances: [1000, 1000],
    }
    const emptyStorage = {
      pubkey: ZERO_ADDRESS,
      balances: [0, 0],
    }

    // SKIP: Test invalid storage slot (storage slot pubkey != sender signature)
    // TODO: Test that it fails if the recipient != to the path of the provided storage slot
    // TODO: Test fails if not enough money.
    // TODO: Test that it returns the correct updated storage slots (with the hash and all that)

    it('should not throw', async () => {
      // Create a transaction which we will infer the type of
      const tx = {
        tokenType: 1,
        recipient: '0x00000003', // some uint32 representing a storage slot
        amount: '0x0000200', // some uint32 value
      }
      // Encode!
      const encoded = abi.encode(
        ['uint', 'uint32', 'uint32'],
        [tx.tokenType, tx.recipient, tx.amount]
      )
      const signedTx = {
        signature: ZERO_SIGNATURE,
        body: encoded
      }
      // Attempt to apply the transaction
      const res = await rollupChain.mockExecuteTx(500, [
        {
          value: sampleStorage,
          inclusionProof: {
            path: ZERO_UINT32,
            siblings: [ZERO_BYTES32],
          },
        },{
          value: sampleStorage,
          inclusionProof: {
            path: tx.recipient,
            siblings: [ZERO_BYTES32],
          },
        }
      ], signedTx)
      const isHalted = await rollupChain.isHalted()
      console.log(isHalted)
    })
  })

  /*
   * Test proveTransitionInvalid()
   * Currently skipping this because we don't have the right tools to generate this cleanly.
   */
  describe.skip('proveTransitionInvalid() ', async () => {
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
        siblings: Array(160).fill(makeRepeatedBytes('99', 32)),
        path: 5,
      }
      // Generate Dummy IncludedStorage
      const dummyInputStorage = {
        value: {
          pubkey: ZERO_ADDRESS,
          balances: [20, 120],
        },
        inclusionProof: dummyStorageInclusionProof,
      }
      // Call the function and see if it works!
      await rollupChain.proveTransitionInvalid(
        includedTransitions[0],
        includedTransitions[1],
        [dummyInputStorage, dummyInputStorage]
      )
      // Did not throw... success!
    })
  })
})
