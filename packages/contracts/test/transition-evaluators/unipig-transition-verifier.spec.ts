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
      const res = await unipigEvaluator.inferTxType(encoded)
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
      const res = await unipigEvaluator.inferTxType(encoded)
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
      const res = await unipigEvaluator.inferTxType(encoded)
      // Check that it's the correct type
      res.should.equal(txTypes.SWAP_TYPE)
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
