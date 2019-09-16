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
  AbiCreateAndTransferTransition,
  AbiTransferTransition,
  AbiSwapTransition,
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
const getStateRoot = (bytes: string) => makeRepeatedBytes(bytes, 32)

const FAILED_TX = 0
const SUCCESSFUL_TX = 1
const UNISWAP_ADDRESS = '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF'

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
   * Test inferTransitionType()
   */
  describe('inferTransitionType() ', async () => {
    const txTypes = {
      TRANSFER_NEW_ACCOUNT_TYPE: 0,
      TRANSFER_STORED_ACCOUNT_TYPE: 1,
      SWAP_TYPE: 2,
    }

    it('should infer a transfer new account transaction', async () => {
      // Create a transaction which we will infer the type of
      const tx = new AbiCreateAndTransferTransition(getStateRoot('ab'), 2, 2, getAddress('01'), 0, 1, getSignature('0'))
      // Encode!
      const encoded = tx.encoded
      // Attempt to infer the transaction type
      const res = await unipigEvaluator.inferTransitionType(encoded)
      // Check that it's the correct type
      res.should.equal(txTypes.TRANSFER_NEW_ACCOUNT_TYPE)
    })

    it('should infer a transfer stored account transaction', async () => {
      // Create a transaction which we will infer the type of
      const tx = new AbiTransferTransition(getStateRoot('ba'), 2, 2, 0, 1, getSignature('0'))
      // Encode!
      const encoded = tx.encoded
      // Attempt to infer the transaction type
      const res = await unipigEvaluator.inferTransitionType(encoded)
      // Check that it's the correct type
      res.should.equal(txTypes.TRANSFER_STORED_ACCOUNT_TYPE)
    })

    it('should infer a swap transaction', async () => {
      // Create a transaction which we will infer the type of
      const tx = new AbiSwapTransition(getStateRoot('cd'), 2, 2, 1, 1, 3, 6, getSignature('0'))
      // Encode!
      const encoded = tx.encoded
      // Attempt to infer the transaction type
      const res = await unipigEvaluator.inferTransitionType(encoded)
      // Check that it's the correct type
      res.should.equal(txTypes.SWAP_TYPE)
    })

    it('should revert if a tx has the wrong number of bytes', async () => {
      try {
        // Attempt to infer a faulty tx type
        const res = await unipigEvaluator.inferTransitionType('0x1234')
      } catch (err) {
        // Success we threw an error!
        return
      }
      throw new Error('Revert expected on invalid tx type length')
    })
  })


  /*
   * Test getTransitionPostStateAndAccessList()
   */
  describe('getTransitionPostStateAndAccessList() ', async () => {
    const stateRoot = getStateRoot('ab')
    const accessList = [1, 2]

    it('should return the expected storage slots for createAndTransferTransition', async () => {
      // Create a transition which we will decode
      const tx = new AbiCreateAndTransferTransition(stateRoot, accessList[0], accessList[1], getAddress('01'), 0, 1, getSignature('9'))
      // Encode!
      const encoded = tx.encoded
      // Attempt to decode the transition
      const res = await unipigEvaluator.getTransitionPostStateAndAccessList(encoded)
      // Check that it returned the expected state root & access list
      res.should.deep.equal([stateRoot, accessList])
    })

    it('should return the expected storage slots for transferTransition', async () => {
      // Create a transition which we will decode
      const tx = new AbiTransferTransition(stateRoot, accessList[0], accessList[1], 0, 1, getSignature('9'))
      // Encode!
      const encoded = tx.encoded
      // Attempt to decode the transition
      const res = await unipigEvaluator.getTransitionPostStateAndAccessList(encoded)
      // Check that it returned the expected state root & access list
      res.should.deep.equal([stateRoot, accessList])
    })

    it('should return the expected storage slots for swapTransition', async () => {
      // Create a transition which we will decode
      const tx = new AbiSwapTransition(stateRoot, accessList[0], accessList[1], 1, 1, 3, 6, getSignature('9'))
      // Encode!
      const encoded = tx.encoded
      // Attempt to decode the transition
      const res = await unipigEvaluator.getTransitionPostStateAndAccessList(encoded)
      // Check that it returned the expected state root & access list
      res.should.deep.equal([stateRoot, accessList])
    })

    it('should throw if we put in some random bytes as the transition', async () => {
      const badEncoding = '0xdeadbeefdeadbeefdeadbeef'
      try {
        // Attempt to decode the transition
        const res = await unipigEvaluator.getTransitionPostStateAndAccessList(badEncoding)
        // It should have failed!
      } catch(err) {
        // Success! It threw!
        return
      }
      throw(new Error('Expected bad encoding to fail!'))
    })
  })

  /*
   * Test applyTransferTx()
   */
  describe.skip('applyTransferTx() ', async () => {

    it('should return the correct storage slots after a successful send', async () => {
      // Set initialization variables
      const sentAmount = 5
      const initialBalance = 1000
      const initialStorage = { pubkey: getAddress('00'), balances: [initialBalance, initialBalance] }
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
      res[1].should.deep.equal([[getAddress('0'), [1000,initialBalance - sentAmount]],[getAddress('0'), [1000,initialBalance + sentAmount]]])
      // Success!
    })

    it('should return an FAILED_TX message if the sender does not have the needed balance', async () => {
      // Set initialization variables
      const sentAmount = 1001
      const initialBalance = 1000
      const initialStorage = { pubkey: getAddress('00'), balances: [initialBalance, initialBalance] }
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
      // Success! We failed! :D :D :D
    })

    // TODO: Enable this test once we add real signature verification to the contract
    it.skip('should throw if the signature for the transfer does not match the sender', async () => {
      // Set initialization variables
      const sentAmount = 10
      const initialBalance = 1000
      const initialStorage = { pubkey: getAddress('00'), balances: [initialBalance, initialBalance] }
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
      throw new Error('Invalid signature did not cause transfer tx to fail!')
    })

    it('should throw if the 2nd storage slot doesnt match the recipient address', async () => {
      // Set initialization variables
      const sentAmount = 10
      const initialBalance = 1000
      const initialStorage = { pubkey: getAddress('00'), balances: [initialBalance, initialBalance] }
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
      throw new Error('Invalid recipient storage slot did not cause transfer tx to fail!')
    })
  })

  /*
   * Test applySwapTx()
   */
  describe.skip('applySwapTx() ', async () => {
    const senderAddress = getAddress('48')
    const timeout = makePaddedUint('00', 32)

    it('should return the correct storage slots after a successful swap', async () => {
      // Set initialization variables
      const inputAmount = 5
      const minOutputAmount = 4
      const initialBalance = 1000
      const initialStorage = { pubkey: getAddress('00'), balances: [initialBalance, initialBalance] }
      const senderStorageSlot = {
        slotIndex: senderAddress,
        value: {...initialStorage},
      }
      const uniswapStorageSlot = {
        slotIndex: UNISWAP_ADDRESS,
        value: {...initialStorage},
      }
      // Create a transaction which we will infer the type of
      const tx = {
        signature: getSignature('00'),
        tokenType: 1,
        inputAmount,
        minOutputAmount,
        timeout,
      }
      // Attempt to apply the transaction
      const res = await unipigEvaluator.applySwapTx(tx, [
        senderStorageSlot, uniswapStorageSlot,
      ])
      // Check to see that the result was successful
      res[0].toNumber().should.equal(SUCCESSFUL_TX)
      res[1].should.deep.equal([[getAddress('0'), [1004,995]],[getAddress('0'), [996,1005]]])
      // Success!
    })

    it('should fail if the min output amount is too high', async () => {
      // Set initialization variables
      const inputAmount = 5
      // We're setting the output amount to 5 -- this won't be what is returned because we have a fee!
      // 1000 + (5 + FEE) = 1000 - OUTPUT          -- note here OUTPUT will have to be less than 5 if FEE > 0.
      const minOutputAmount = 5
      const initialBalance = 1000
      const initialStorage = { pubkey: getAddress('00'), balances: [initialBalance, initialBalance] }
      const senderStorageSlot = {
        slotIndex: senderAddress,
        value: {...initialStorage},
      }
      const uniswapStorageSlot = {
        slotIndex: UNISWAP_ADDRESS,
        value: {...initialStorage},
      }
      // Create a transaction which we will infer the type of
      const tx = {
        signature: getSignature('00'),
        tokenType: 1,
        inputAmount,
        minOutputAmount,
        timeout,
      }
      // Attempt to apply the transaction
      const res = await unipigEvaluator.applySwapTx(tx, [
        senderStorageSlot, uniswapStorageSlot,
      ])
      // Check to see that the result was successful
      res[0].toNumber().should.equal(FAILED_TX)
      // Success! We failed! :D :D :D
    })

    it('should fail if the sender cant afford the swap', async () => {
      // Set initialization variables
      const initialBalance = 1000
      // NOTE: We're setting the input amount above the initial balances!
      const inputAmount = initialBalance + 1
      const minOutputAmount = 5
      const initialStorage = { pubkey: getAddress('00'), balances: [initialBalance, initialBalance] }
      const senderStorageSlot = {
        slotIndex: senderAddress,
        value: {...initialStorage},
      }
      const uniswapStorageSlot = {
        slotIndex: UNISWAP_ADDRESS,
        value: {...initialStorage},
      }
      // Create a transaction which we will infer the type of
      const tx = {
        signature: getSignature('00'),
        tokenType: 1,
        inputAmount,
        minOutputAmount,
        timeout,
      }
      // Attempt to apply the transaction
      const res = await unipigEvaluator.applySwapTx(tx, [
        senderStorageSlot, uniswapStorageSlot,
      ])
      // Check to see that the result was successful
      res[0].toNumber().should.equal(FAILED_TX)
      // Success! We failed! :D :D :D
    })

    it.skip('should throw if the signature for the swap does not match the sender', async () => {
      // Set initialization variables
      const inputAmount = 5
      const minOutputAmount = 4
      const initialBalance = 1000
      const initialStorage = { pubkey: getAddress('00'), balances: [initialBalance, initialBalance] }
      const senderStorageSlot = {
        slotIndex: senderAddress,
        value: {...initialStorage},
      }
      const uniswapStorageSlot = {
        slotIndex: UNISWAP_ADDRESS,
        value: {...initialStorage},
      }
      // Create a transaction which we will infer the type of
      const tx = {
        // WRONG SIGNATURE!
        signature: getSignature('deadbeef'),
        tokenType: 1,
        inputAmount,
        minOutputAmount,
        timeout,
      }
      try {
        // Attempt to apply the transaction
        const res = await unipigEvaluator.applySwapTx(tx, [
          senderStorageSlot, uniswapStorageSlot,
        ])
      } catch(err) {
        // Good we failed! Let's return
        return
      }
      throw new Error('Invalid signature did not cause swap tx to fail!')
    })

    it('should throw if the 2nd storage slot doesnt match the Uniswap address', async () => {
      // Set initialization variables
      const inputAmount = 5
      const minOutputAmount = 4
      const initialBalance = 1000
      const initialStorage = { pubkey: getAddress('00'), balances: [initialBalance, initialBalance] }
      const senderStorageSlot = {
        slotIndex: senderAddress,
        value: {...initialStorage},
      }
      const NOT_UNISWAP_ADDRESS = getAddress('deadbeef')
      const uniswapStorageSlot = {
        slotIndex: NOT_UNISWAP_ADDRESS,
        value: {...initialStorage},
      }
      // Create a transaction which we will infer the type of
      const tx = {
        // WRONG SIGNATURE!
        signature: getSignature('deadbeef'),
        tokenType: 1,
        inputAmount,
        minOutputAmount,
        timeout,
      }
      try {
        // Attempt to apply the transaction
        const res = await unipigEvaluator.applySwapTx(tx, [
          senderStorageSlot, uniswapStorageSlot,
        ])
      } catch(err) {
        // Good we failed! Let's return
        return
      }
      throw new Error('Invalid Uniswap storage slot address did not cause swap tx to fail!')
    })
  })
})
