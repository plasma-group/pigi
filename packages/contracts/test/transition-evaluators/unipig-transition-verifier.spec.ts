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
  makeRepeatedBytes,
  makePaddedBytes,
  makePaddedUint,
  ZERO_BYTES32,
  ZERO_ADDRESS,
  ZERO_UINT32,
  ZERO_SIGNATURE,
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
const log = debug('test:info:unipig-transition-evaluator')

/* Contract Imports */
import * as UnipigTransitionEvaluator from '../../build/UnipigTransitionEvaluator.json'
import * as SparseMerkleTreeLib from '../../build/SparseMerkleTreeLib.json'

/* Helpers */
const STORAGE_TREE_HEIGHT = 5
const AMOUNT_BYTES = 5
const getSlot = (storageSlot: string) => makePaddedUint(storageSlot, STORAGE_TREE_HEIGHT)
const getAmount = (amount: string) => makePaddedUint(amount, AMOUNT_BYTES)
const getAddress = (address: string) => makeRepeatedBytes(address, 20)
const getSignature = (sig: string) => makeRepeatedBytes(sig, 65)

/* Begin tests */
describe.only('UnipigTransitionEvaluator', () => {
  const provider = createMockProvider()
  const [wallet1] = getWallets(provider)
  let unipigEvaluator

  /* Deploy a new RollupChain before each test */
  beforeEach(async () => {
    unipigEvaluator = await deployContract(wallet1, UnipigTransitionEvaluator, [], {
      gasLimit: 6700000,
    })
  })

  /*
   * Test inferTxType()
   */
  describe.only('inferTxType() ', async () => {
    const txTypes = {
      NEW_STORAGE_SLOT_TYPE: 0,
      STORED_ACCOUNT_TRANSFER_TYPE: 1,
      SWAP_TYPE: 2,
    }

    it('should infer a transfer tx to a new account', async () => {
      // Create a tx which we will infer the type of
      const tx = {
        storageSlot: getSlot('555'),
        pubkey: getAddress('01'),
      }
      // Encode!
      const encoded = abi.encode(
        ['uint', 'address'],
        [tx.storageSlot, tx.pubkey]
      )
      // Attempt to infer the transaction type
      const res = await unipigEvaluator.inferTxType(encoded)
      // Check that it's the correct type
      res.should.equal(txTypes.NEW_STORAGE_SLOT_TYPE)
    })

    it('should infer a transfer transaction', async () => {
      // Create a transaction which we will infer the type of
      const tx = {
        signature: getSignature('0'),
        tokenType: 1,
        recipient: getSlot('555'),
        amount: getAmount('3'),
      }
      // Encode!
      const encoded = abi.encode(
        ['bytes', 'uint', 'uint40', 'uint40'],
        [tx.signature, tx.tokenType, tx.recipient, tx.amount]
      )
      // Attempt to infer the transaction type
      const res = await unipigEvaluator.inferTxType(encoded)
      // Check that it's the correct type
      res.should.equal(txTypes.STORED_ACCOUNT_TRANSFER_TYPE)
    })

    it('should infer a transfer transaction to a swap', async () => {
      // Create a transaction which we will infer the type of
      const tx = {
        signature: getSignature('0'),
        tokenType: 1,
        inputAmount: getAmount('1010'),
        minOutputAmount: getAmount('1000'),
        timeout: makeRepeatedBytes('08', 32),
      }
      // Encode!
      const encoded = abi.encode(
        ['bytes', 'uint', 'uint40', 'uint40', 'bytes32'],
        [tx.signature, tx.tokenType, tx.inputAmount, tx.minOutputAmount, tx.timeout]
      )
      // Attempt to infer the transaction type
      const res = await unipigEvaluator.inferTxType(encoded)
      // Check that it's the correct type
      res.should.equal(txTypes.SWAP_TYPE)
    })

    it('should revert if a tx has the wrong number of bytes', async () => {
      try {
        // Attempt to infer a faulty tx type
        const res = await unipigEvaluator.inferTxType('0x1234')
      } catch (err) {
        // Success we threw an error!
        return
      }
      throw new Error('Revert expected on invalid tx type length')
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
      const res = await unipigEvaluator.evaluateTransition(signedTx, [
        {
          slotIndex: '0x00000003',
          value: sampleStorage,
        },{
          slotIndex: '0x00000003',
          value: sampleStorage,
        },
      ])
      log('did we make it?')
    })
  })
})
