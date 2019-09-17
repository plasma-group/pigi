import MemDown from 'memdown'
import './setup'
import { DB, BaseDB } from '@pigi/core'

import {
  assertThrowsAsync,
  calculateSwapWithFees,
  getGenesisState,
  getGenesisStateLargeEnoughForFees,
} from './helpers'
import {
  UNI_TOKEN_TYPE,
  UNISWAP_ADDRESS,
  InsufficientBalanceError,
  IdentityVerifier,
  DefaultRollupStateMachine,
  SignedTransaction,
  PIGI_TOKEN_TYPE,
} from '../src'

/* External Imports */

/* Internal Imports */

/*********
 * TESTS *
 *********/

describe('RollupStateMachine', () => {
  let rollupState
  let db: DB

  beforeEach(async () => {
    db = new BaseDB(new MemDown('') as any, 256)
    rollupState = await DefaultRollupStateMachine.create(
      getGenesisState(),
      db,
      IdentityVerifier.instance()
    )
  })

  afterEach(async () => {
    await db.close()
  })

  describe('getBalances', () => {
    it('should not throw even if the account doesnt exist', async () => {
      const response = await rollupState.getBalances('this is not an address!')
      response.should.deep.equal({
        [UNI_TOKEN_TYPE]: 0,
        [PIGI_TOKEN_TYPE]: 0,
      })
    })
  })

  describe('applyTransfer', () => {
    const txAliceToBob: SignedTransaction = {
      signature: 'alice',
      transaction: {
        sender: 'alice',
        recipient: 'bob',
        tokenType: UNI_TOKEN_TYPE,
        amount: 5,
      },
    }

    it('should not throw when alice sends 5 uni from genesis', async () => {
      const aliceBalance = await rollupState.getBalances('alice')
      aliceBalance.should.deep.equal(getGenesisState().alice.balances)
      const result = await rollupState.applyTransaction(txAliceToBob)
    })

    it('should update balances after transfer', async () => {
      const result = await rollupState.applyTransaction(txAliceToBob)

      const aliceBalance = await rollupState.getBalances('alice')
      aliceBalance[UNI_TOKEN_TYPE].should.equal(
        getGenesisState().alice.balances[UNI_TOKEN_TYPE] - 5
      )

      const bobBalance = await rollupState.getBalances('bob')
      bobBalance[UNI_TOKEN_TYPE].should.deep.equal(5)
    })

    it('should throw if transfering too much money', async () => {
      const invalidTxApply = async () =>
        rollupState.applyTransaction({
          signature: 'alice',
          transaction: {
            sender: 'alice',
            tokenType: UNI_TOKEN_TYPE,
            recipient: 'bob',
            amount: 500,
          },
        })
      await assertThrowsAsync(invalidTxApply, InsufficientBalanceError)
    })
  })

  describe('applySwap', () => {
    let uniInput
    let expectedPigiAfterFees
    let txAliceSwapUni

    beforeEach(() => {
      uniInput = 25
      expectedPigiAfterFees = calculateSwapWithFees(
        uniInput,
        getGenesisState()[UNISWAP_ADDRESS].balances[UNI_TOKEN_TYPE],
        getGenesisState()[UNISWAP_ADDRESS].balances[PIGI_TOKEN_TYPE],
        0
      )

      txAliceSwapUni = {
        signature: 'alice',
        transaction: {
          sender: 'alice',
          tokenType: UNI_TOKEN_TYPE,
          inputAmount: uniInput,
          minOutputAmount: expectedPigiAfterFees,
          timeout: +new Date() + 1000,
        },
      }
    })

    it('should not throw when alice swaps 5 uni from genesis', async () => {
      const result = await rollupState.applyTransaction(txAliceSwapUni)
    })

    it('should update balances after swap', async () => {
      const result = await rollupState.applyTransaction(txAliceSwapUni)

      const aliceBalances = await rollupState.getBalances('alice')
      aliceBalances[UNI_TOKEN_TYPE].should.equal(
        getGenesisState().alice.balances[UNI_TOKEN_TYPE] - uniInput
      )
      aliceBalances[PIGI_TOKEN_TYPE].should.equal(
        getGenesisState().alice.balances[PIGI_TOKEN_TYPE] +
          expectedPigiAfterFees
      )

      // And we should have the opposite balances for uniswap
      const uniswapBalances = await rollupState.getBalances(UNISWAP_ADDRESS)
      uniswapBalances[UNI_TOKEN_TYPE].should.equal(
        getGenesisState()[UNISWAP_ADDRESS].balances[UNI_TOKEN_TYPE] + uniInput
      )
      uniswapBalances[PIGI_TOKEN_TYPE].should.equal(
        getGenesisState()[UNISWAP_ADDRESS].balances[PIGI_TOKEN_TYPE] -
          expectedPigiAfterFees
      )
    })

    it('should update balances after swap including fee', async () => {
      const feeBasisPoints = 30
      rollupState = await DefaultRollupStateMachine.create(
        getGenesisStateLargeEnoughForFees(),
        db,
        IdentityVerifier.instance()
      )

      uniInput = 2500
      expectedPigiAfterFees = calculateSwapWithFees(
        uniInput,
        getGenesisStateLargeEnoughForFees()[UNISWAP_ADDRESS].balances[
          UNI_TOKEN_TYPE
        ],
        getGenesisStateLargeEnoughForFees()[UNISWAP_ADDRESS].balances[
          PIGI_TOKEN_TYPE
        ],
        feeBasisPoints
      )

      txAliceSwapUni = {
        signature: 'alice',
        transaction: {
          sender: 'alice',
          tokenType: UNI_TOKEN_TYPE,
          inputAmount: uniInput,
          minOutputAmount: expectedPigiAfterFees,
          timeout: +new Date() + 1000,
        },
      }

      await rollupState.applyTransaction(txAliceSwapUni)

      const aliceBalances = await rollupState.getBalances('alice')
      aliceBalances[UNI_TOKEN_TYPE].should.equal(
        getGenesisStateLargeEnoughForFees().alice.balances[UNI_TOKEN_TYPE] -
          uniInput
      )
      aliceBalances[PIGI_TOKEN_TYPE].should.equal(
        getGenesisStateLargeEnoughForFees().alice.balances[PIGI_TOKEN_TYPE] +
          expectedPigiAfterFees
      )
      // And we should have the opposite balances for uniswap

      const uniswapBalances = await rollupState.getBalances(UNISWAP_ADDRESS)
      uniswapBalances[UNI_TOKEN_TYPE].should.equal(
        getGenesisStateLargeEnoughForFees()[UNISWAP_ADDRESS].balances[
          UNI_TOKEN_TYPE
        ] + uniInput
      )
      uniswapBalances[PIGI_TOKEN_TYPE].should.equal(
        getGenesisStateLargeEnoughForFees()[UNISWAP_ADDRESS].balances[
          PIGI_TOKEN_TYPE
        ] - expectedPigiAfterFees
      )
    })
  })
})
