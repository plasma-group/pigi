import './setup'

/* External Imports */
import {SignedTransaction, Swap, RollupTransaction, Transfer, State, StateReceipt} from '../src/types'
import {
  abiEncodeSignedTransaction, abiEncodeState, abiEncodeStateReceipt,
  abiEncodeTransaction,
  parseSignedTransactionFromABI, parseStateFromABI, parseStateReceiptFromABI,
  parseTransactionFromABI,
} from '../src/serialization'
import {BOB_ADDRESS} from "./helpers";
import {PIGI_TOKEN_TYPE, UNI_TOKEN_TYPE} from "../src";
import {ethers} from "ethers";

/* Internal Imports */

describe('RollupEncoding', () => {
  describe('Transactions', () => {
    it('should encoded & decode Transfer without throwing', async () => {
      const address = '0x' + '31'.repeat(20)
      const tx: Transfer = {
        sender: address,
        recipient: address,
        tokenType: 1,
        amount: 15,
      }

      const abiEncoded: string = abiEncodeTransaction(tx)
      const transfer: RollupTransaction = parseTransactionFromABI(abiEncoded)

      transfer.should.deep.equal(tx)
    })

    it('should encoded & decode Swap without throwing', async () => {
      const address = '0x' + '31'.repeat(20)
      const tx: Swap = {
        sender: address,
        tokenType: 1,
        inputAmount: 15,
        minOutputAmount: 4,
        timeout: +new Date(),
      }

      const abiEncoded: string = abiEncodeTransaction(tx)
      const swap: RollupTransaction = parseTransactionFromABI(abiEncoded)

      swap.should.deep.equal(tx)
    })

    it('should encoded & decode SignedTransactions without throwing', async () => {
      const address = '0x' + '31'.repeat(20)
      const transfer: Transfer = {
        sender: address,
        recipient: address,
        tokenType: 1,
        amount: 15,
      }
      const signedTransfer: SignedTransaction = {
        signature: '0x1234',
        transaction: transfer,
      }

      const swap: Swap = {
        sender: address,
        tokenType: 1,
        inputAmount: 15,
        minOutputAmount: 4,
        timeout: +new Date(),
      }
      const signedSwap: SignedTransaction = {
        signature: '0x4321',
        transaction: swap,
      }

      const abiEncodedSwap: string = abiEncodeSignedTransaction(signedSwap)
      const abiEncodedTransfer: string = abiEncodeSignedTransaction(
        signedTransfer
      )
      abiEncodedSwap.should.not.equal(abiEncodedTransfer)

      const parsedSwap: SignedTransaction = parseSignedTransactionFromABI(
        abiEncodedSwap
      )
      const parsedTransfer: SignedTransaction = parseSignedTransactionFromABI(
        abiEncodedTransfer
      )
      parsedSwap.should.not.deep.equal(parsedTransfer)

      parsedSwap.should.deep.equal(signedSwap)
      parsedTransfer.should.deep.equal(signedTransfer)
    })
  })

  describe('State', () => {
    it('should encoded & decode State without throwing', async () => {
      const state: State =  {
        address: BOB_ADDRESS,
        balances: {
          [UNI_TOKEN_TYPE]: 50,
          [PIGI_TOKEN_TYPE]: 100
        }
      }

      const stateString: string = abiEncodeState(state)
      const parsedState: State = parseStateFromABI(stateString)

      parsedState.should.deep.equal(state)
    })
  })

  describe('State', () => {
    it('should encoded & decode StateReceipt without throwing', async () => {
      const state: State =  {
        address: BOB_ADDRESS,
        balances: {
          [UNI_TOKEN_TYPE]: 50,
          [PIGI_TOKEN_TYPE]: 100
        }
      }
      const stateReceipt: StateReceipt = {
        leafID: 0,
        stateRoot: "TEST",
        inclusionProof: [],
        blockNumber: 1,
        transitionIndex: 2,
        state
      }

      const stateReceiptString: string = abiEncodeStateReceipt(stateReceipt)
      const parsedStateReceipt: StateReceipt = parseStateReceiptFromABI(stateReceiptString)

      parsedStateReceipt.should.deep.equal(stateReceipt)
    })
  })
})
