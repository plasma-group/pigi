import '../setup'

/* Internal Imports */
import {
  Transition,
  generateNTransitions,
  RollupBlock,
  makeRepeatedBytes,
  makePaddedBytes,
  makePaddedUint,
  ZERO_BYTES32,
  ZERO_ADDRESS,
  ZERO_UINT32,
  ZERO_SIGNATURE,
  getSlot,
  getAmount,
  getAddress,
  getSignature,
  getStateRoot,
  UNISWAP_ADDRESS,
  UNISWAP_STORAGE_SLOT,
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
import {
  SwapTransition,
  TransferTransition,
  CreateAndTransferTransition,
  abiEncodeTransition,
} from '@pigi/wallet'

/* Logging */
import debug from 'debug'
const log = debug('test:info:rollup-chain-manager')

/* Contract Imports */
import * as RollupChain from '../../build/RollupChain.json'
import * as UnipigTransitionEvaluator from '../../build/UnipigTransitionEvaluator.json'
import * as RollupMerkleUtils from '../../build/RollupMerkleUtils.json'

/* Begin tests */
describe('RollupChain', () => {
  const provider = createMockProvider()
  const [wallet1] = getWallets(provider)
  let rollupChain
  let rollupMerkleUtils
  let unipigEvaluator
  let rollupCtLogFilter

  /* Link libraries before tests */
  before(async () => {
    unipigEvaluator = await deployContract(
      wallet1,
      UnipigTransitionEvaluator,
      [],
      {
        gasLimit: 6700000,
      }
    )
    rollupMerkleUtils = await deployContract(wallet1, RollupMerkleUtils, [], {
      gasLimit: 6700000,
    })
  })

  /* Deploy a new RollupChain before each test */
  beforeEach(async () => {
    rollupChain = await deployContract(
      wallet1,
      RollupChain,
      [unipigEvaluator.address, rollupMerkleUtils.address],
      {
        gasLimit: 6700000,
      }
    )
    rollupCtLogFilter = {
      address: rollupChain.address,
      fromBlock: 0,
      toBlock: 'latest',
    }
  })

  /*
   * Test submitBlock()
   */
  describe('submitBlock() ', async () => {
    it('should not throw as long as it gets a bytes array (even if its invalid)', async () => {
      await rollupChain.submitBlock(['0x1234', '0x1234'])
      // Did not throw... success!
    })

    it('should process blocks many transitions', async () => {
      // The number of transitions in our block
      const numTransitions = 50

      await rollupChain.submitBlock(['0x1234', '0x1234'])
      // Create a block with many transitions
      const createAndTransfer: CreateAndTransferTransition = {
        stateRoot: getStateRoot('ab'),
        senderSlotIndex: 2,
        recipientSlotIndex: 2,
        createdAccountPubkey: getAddress('11'),
        tokenType: 0,
        amount: 1,
        signature: getSignature('0ad1'),
      }
      const transfer: TransferTransition = {
        stateRoot: getStateRoot('ab'),
        senderSlotIndex: 2,
        recipientSlotIndex: 2,
        tokenType: 0,
        amount: 1,
        signature: getSignature('ab10'),
      }
      const swap: SwapTransition = {
        stateRoot: getStateRoot('cd'),
        senderSlotIndex: 2,
        uniswapSlotIndex: 0,
        tokenType: 1,
        inputAmount: 1,
        minOutputAmount: 3,
        timeout: 6,
        signature: getSignature('1301'),
      }
      // Encode!
      const encoded = [
        abiEncodeTransition(createAndTransfer),
        abiEncodeTransition(transfer),
        abiEncodeTransition(swap),
      ]
      // Now lets build tons of these txs!!!
      const fullCallData = []
      for (let i = 0; i < numTransitions; i++) {
        fullCallData.push(encoded[Math.floor(Math.random() * encoded.length)])
      }
      // Add the block, creating the sparse merkle tree!
      const result = await rollupChain.submitBlock(fullCallData)
      // If desired, log the result to check the gas usage
      // log(result)
      // Did not throw... success!
    }).timeout(3000)
  })

  /*
   * Test verifySequentialTransitions()
   */
  describe('verifySequentialTransitions()', async () => {
    let blocks
    // Before each test let's submit a couple blocks
    beforeEach(async () => {
      // Create two blocks from some default transitions
      blocks = [
        new RollupBlock(generateNTransitions(10), 0),
        new RollupBlock(generateNTransitions(10), 1),
      ]
      for(const block of blocks) { await block.generateTree() }
      // Submit the blocks
      await rollupChain.submitBlock(blocks[0].encodedTransitions)
      await rollupChain.submitBlock(blocks[1].encodedTransitions)
    })

    describe('same block', async () => {
      it('should NOT throw if the transitions are sequential in the same block', async () => {
        const includedTransitions = [
          await blocks[0].getIncludedTransition(0),
          await blocks[0].getIncludedTransition(1),
        ]
        await rollupChain.verifySequentialTransitions(
          includedTransitions[0],
          includedTransitions[1]
        )
      })

      it('should throw if they are not sequential in the same block', async () => {
        const includedTransitions = [
          await blocks[0].getIncludedTransition(0),
          await blocks[0].getIncludedTransition(2),
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
          await blocks[0].getIncludedTransition(blocks[0].transitions.length - 1),
          // First transition of the next block
          await blocks[1].getIncludedTransition(0),
        ]
        await rollupChain.verifySequentialTransitions(
          includedTransitions[0],
          includedTransitions[1]
        )
      })

      it('should throw if the transitions are NOT last of prev block & first of next block', async () => {
        const includedTransitions = [
          await blocks[0].getIncludedTransition(0),
          await blocks[1].getIncludedTransition(0),
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
   * Test verifySequentialTransitions()
   */
  describe('checkTransitionIncluded()', async () => {
    it('should verify n included transitions for the first block', async () => {
      // Create a block from some default transitions
      const block = new RollupBlock(generateNTransitions(10), 0)
      await block.generateTree()
      // Actually submit the block
      await rollupChain.submitBlock(block.encodedTransitions)
      // Now check that each one was included
      for (let i = 0; i < block.transitions.length; i++) {
        const inclusionProof = await block.getInclusionProof(i)
        const isIncluded = await rollupChain.checkTransitionInclusion({
          transition: block.encodedTransitions[i],
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
      await block0.generateTree()
      await block1.generateTree()
      // Submit the blocks
      await rollupChain.submitBlock(block0.encodedTransitions)
      await rollupChain.submitBlock(block1.encodedTransitions)
      // Now check that all transitions for the 2nd block were included
      for (let i = 0; i < block1.transitions.length; i++) {
        const inclusionProof = await block1.getInclusionProof(i)
        const isIncluded = await rollupChain.checkTransitionInclusion({
          transition: block1.encodedTransitions[i],
          inclusionProof,
        })
        // Make sure it was included!
        isIncluded.should.equal(true)
      }
    })

    it('should fail to verify inclusion for a transition which is not included', async () => {
      // Create a block from some default transitions
      const block0 = new RollupBlock(generateNTransitions(5), 0)
      await block0.generateTree()
      // Submit the blocks
      await rollupChain.submitBlock(block0.encodedTransitions)
      // Now check that we don't return true if a transition shouldn't have been included
      const notIncluded = '0xdeadbeefdeadbeefdeadbeef'
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
   * Test getStateRootsAndStorageSlots()
   */
  describe('getStateRootsAndStorageSlots()', async () => {
    it('should not throw', async () => {
      const expectedSlots = [5, 10]
      // Create two transfer transitions
      const transferTransitions: TransferTransition[] = [
        {
          stateRoot: getStateRoot('ab'),
          senderSlotIndex: expectedSlots[0],
          recipientSlotIndex: expectedSlots[1],
          tokenType: 0,
          amount: 1,
          signature: getSignature('42'),
        },
        {
          stateRoot: getStateRoot('ab'),
          senderSlotIndex: expectedSlots[0],
          recipientSlotIndex: expectedSlots[1],
          tokenType: 0,
          amount: 1,
          signature: getSignature('42'),
        },
      ]
      const transferTransitionsEncoded = transferTransitions.map((transition) =>
        abiEncodeTransition(transition)
      )

      // Create a rollup block
      const block = new RollupBlock(transferTransitions, 0)
      await block.generateTree()
      // Get two included transitions
      const includedTransitions = [
        await block.getIncludedTransition(0),
        await block.getIncludedTransition(1),
      ]
      // Call the function!
      const res = await rollupChain.getStateRootsAndStorageSlots(
        transferTransitionsEncoded[0],
        transferTransitionsEncoded[1]
      )
      // Did not throw... success!
    })
  })

  /*
   * Test proveTransitionInvalid()
   * Currently skipping this because we don't have the right tools to generate this cleanly.
   */
  describe('proveTransitionInvalid() ', async () => {
    it('should not throw', async () => {
      const storageSlots = [5, 10]
      // Create two transfer transitions
      const transferTransitions: TransferTransition[] = [
        {
          stateRoot: getStateRoot('ab'),
          senderSlotIndex: storageSlots[0],
          recipientSlotIndex: storageSlots[1],
          tokenType: 0,
          amount: 1,
          signature: getSignature('42'),
        },
        {
          stateRoot: getStateRoot('cd'),
          senderSlotIndex: storageSlots[0],
          recipientSlotIndex: storageSlots[1],
          tokenType: 0,
          amount: 1,
          signature: getSignature('42'),
        },
      ]
      const transferTransitionsEncoded = transferTransitions.map((transition) =>
        abiEncodeTransition(transition)
      )

      // Create a rollup block
      const block = new RollupBlock(transferTransitions, 0)
      await block.generateTree()
      // Submit the rollup block
      await rollupChain.submitBlock(block.encodedTransitions)
      // Get two included transitions
      const includedTransitions = [
        await block.getIncludedTransition(0),
        await block.getIncludedTransition(1),
      ]
      // TODO: Create a state tree & actually use valid inclusion proofs for the state tree.
      // Then we can check the result
      // const stateTree = ........
      // Create two included storage slots
      const includedStorageSlots = [
        {
          storageSlot: {
            value: {
              pubkey: ZERO_ADDRESS,
              balances: [20, 120],
            },
            slotIndex: storageSlots[0],
          },
          siblings: Array(32).fill(makeRepeatedBytes('99', 32)),
        },
        {
          storageSlot: {
            value: {
              pubkey: ZERO_ADDRESS,
              balances: [20, 120],
            },
            slotIndex: storageSlots[1],
          },
          siblings: Array(32).fill(makeRepeatedBytes('99', 32)),
        },
      ]
      // Call the function and see if it works!
      await rollupChain.proveTransitionInvalid(
        includedTransitions[0],
        includedTransitions[1],
        includedStorageSlots
      )
      // Did not throw... success!
    })
  })
})
