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

const FAILED_TX = 0
const SUCCESSFUL_TX = 1

/* Begin tests */
describe('UnipigTransitionEvaluator', () => {
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
      TRANSFER_TYPE: 0,
      SWAP_TYPE: 1,
    }

    it('should infer a transfer transaction', async () => {
      // Create a transaction which we will infer the type of
      const tx = {
        signature: getSignature('0'),
        tokenType: 1,
        recipient: getAddress('01'),
        amount: getAmount('3'),
      }
      // Encode!
      const encoded = abi.encode(
        ['bytes', 'uint', 'address', 'uint32'],
        [tx.signature, tx.tokenType, tx.recipient, tx.amount]
      )
      // Attempt to infer the transaction type
      const res = await unipigEvaluator.inferTxType(encoded)
      // Check that it's the correct type
      res.should.equal(txTypes.TRANSFER_TYPE)
    })

    it('should infer a swap transaction', async () => {
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
        ['bytes', 'uint', 'uint32', 'uint32', 'bytes32'],
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
   * Test applyTransferTx()
   */
  describe('applyTransferTx() ', async () => {
    const emptyStorage = {
      balances: [0, 0],
    }

    it('should return the correct storage leaf nodes after a successful send', async () => {
      // Set initialization variables
      const sentAmount = 5
      const initialBalance = 1000
      const initialStorage = { balances: [initialBalance, initialBalance] }
      const senderAddress = getAddress('48')
      const recipientAddress = getAddress('38')
      const senderStorageSlot = {
        slotIndex: senderAddress,
        value: {...initialStorage},
      }
      const recipientStorageSlot = {
        slotIndex: recipientAddress,
        value: {...initialStorage},
      }
      // Create a transaction which we will infer the type of
      const tx = {
        signature: getSignature('00'),
        tokenType: 1,
        recipient: recipientAddress,
        amount: getAmount(sentAmount + ''),
      }
      // Attempt to apply the transaction
      const res = await unipigEvaluator.applyTransferTx(tx, [
        senderStorageSlot, recipientStorageSlot,
      ])
      // Check to see that the result was successful
      res[0].toNumber().should.equal(SUCCESSFUL_TX)
      // Make sure the balances are what we expect
      res[1].should.deep.equal([[[1000,initialBalance - sentAmount]],[[1000,initialBalance + sentAmount]]])
      // Success!
    })

    it('should return an FAILED_TX message if the sender does not have the needed balance', async () => {
      // Set initialization variables
      const sentAmount = 1001
      const initialBalance = 1000
      const initialStorage = { balances: [initialBalance, initialBalance] }
      const senderAddress = getAddress('48')
      const recipientAddress = getAddress('38')
      const senderStorageSlot = {
        slotIndex: senderAddress,
        value: {...initialStorage},
      }
      const recipientStorageSlot = {
        slotIndex: recipientAddress,
        value: {...initialStorage},
      }
      // Create a transaction which we will infer the type of
      const tx = {
        signature: getSignature('00'),
        tokenType: 1,
        recipient: recipientAddress,
        amount: getAmount(sentAmount + ''),
      }
      // Attempt to apply the transaction
      const res = await unipigEvaluator.applyTransferTx(tx, [
        senderStorageSlot, recipientStorageSlot,
      ])
      // Make sure the tx result is FAILED
      res[0].toNumber().should.equal(FAILED_TX)
    })

    // TODO: Enable this test once we add real signature verification to the contract
    it.skip('should throw if the signature does not match the sender', async () => {
      // Set initialization variables
      const sentAmount = 10
      const initialBalance = 1000
      const initialStorage = { balances: [initialBalance, initialBalance] }
      const senderAddress = getAddress('48')
      const recipientAddress = getAddress('38')
      const senderStorageSlot = {
        slotIndex: senderAddress,
        value: {...initialStorage},
      }
      const recipientStorageSlot = {
        slotIndex: recipientAddress,
        value: {...initialStorage},
      }
      // Create a transaction which we will infer the type of
      const tx = {
        // Input an invalid signature
        signature: getSignature('deadbeef'),
        tokenType: 1,
        recipient: recipientAddress,
        amount: getAmount(sentAmount + ''),
      }
      try {
        // Attempt to apply the transaction
        const res = await unipigEvaluator.applyTransferTx(tx, [
          senderStorageSlot, recipientStorageSlot,
        ])
      } catch(err) {
        // Good we failed! Let's return
        return
      }
      throw new Error('Invalid signature did not cause tx to fail!')
    })

    it('should throw if the 2nd storage slot doesnt match the recipient address', async () => {
      // Set initialization variables
      const sentAmount = 10
      const initialBalance = 1000
      const initialStorage = { balances: [initialBalance, initialBalance] }
      const senderAddress = getAddress('48')
      const recipientAddress = getAddress('38')
      const NOTrecipientAddress = getAddress('99')
      const senderStorageSlot = {
        slotIndex: senderAddress,
        value: {...initialStorage},
      }
      const recipientStorageSlot = {
        slotIndex: recipientAddress,
        value: {...initialStorage},
      }
      // Create a transaction which we will infer the type of
      const tx = {
        signature: getSignature('00'),
        tokenType: 1,
        recipient: NOTrecipientAddress,
        amount: getAmount(sentAmount + ''),
      }
      try {
        // Attempt to apply the transaction
        const res = await unipigEvaluator.applyTransferTx(tx, [
          senderStorageSlot, recipientStorageSlot,
        ])
      } catch(err) {
        // Good we failed! Let's return
        return
      }
      throw new Error('Invalid recipient storage slot did not cause tx to fail!')
    })
  })
})
