import './setup'

/* External Imports */

/* Internal Imports */
import {
  UnipigWallet,
  UNI_TOKEN_TYPE,
  Address,
  MockRollupStateMachine,
  UNISWAP_ADDRESS,
} from '../src'

/***********
 * HELPERS *
 ***********/

/*********
 * TESTS *
 *********/

const genesisState = {
  [UNISWAP_ADDRESS]: {
    balances: {
      uni: 50,
      pigi: 50,
    },
  },
  alice: {
    balances: {
      uni: 50,
      pigi: 50,
    },
  },
}

describe('RollupStateMachine', async () => {
  let rollupState
  beforeEach(() => {
    rollupState = new MockRollupStateMachine(
      JSON.parse(JSON.stringify(genesisState))
    )
  })

  describe('getBalances', async () => {
    it('should not throw even if the account doesnt exist', () => {
      const response = rollupState.getBalances('this is not an address!')
      response.should.deep.equal({
        uni: 0,
        pigi: 0,
      })
    })
  })

  describe('applyTransfer', async () => {
    const txAliceToBob = {
      signature: 'alice',
      transaction: {
        tokenType: UNI_TOKEN_TYPE,
        recipient: 'bob',
        amount: 5,
      },
    }

    it('should not throw when alice sends 5 uni from genesis', () => {
      rollupState
        .getBalances('alice')
        .should.deep.equal(genesisState.alice.balances)
      const result = rollupState.applyTransaction(txAliceToBob)
    })

    it('should update balances after transfer', () => {
      const result = rollupState.applyTransaction(txAliceToBob)
      rollupState
        .getBalances('alice')
        .uni.should.equal(genesisState.alice.balances.uni - 5)
      rollupState.getBalances('bob').uni.should.deep.equal(5)
    })

    it('should fail if transfering too much money', () => {
      const result = rollupState.applyTransaction({
        signature: 'alice',
        transaction: {
          tokenType: UNI_TOKEN_TYPE,
          recipient: 'bob',
          amount: 500,
        },
      })
      result.status.should.equal('FAILURE')
    })
  })

  describe('applySwap', async () => {
    const inputAmount = 25
    const minOutputAmount = 16
    const txAliceSwapUni = {
      signature: 'alice',
      transaction: {
        tokenType: UNI_TOKEN_TYPE,
        inputAmount,
        minOutputAmount,
        timeout: +new Date() + 1000,
      },
    }

    it('should not throw when alice swaps 5 uni from genesis', () => {
      const result = rollupState.applyTransaction(txAliceSwapUni)
    })

    it('should update balances after swap', () => {
      const result = rollupState.applyTransaction(txAliceSwapUni)
      rollupState
        .getBalances('alice')
        .uni.should.equal(genesisState.alice.balances.uni - inputAmount)
      rollupState
        .getBalances('alice')
        .pigi.should.equal(genesisState.alice.balances.pigi + minOutputAmount)
      // And we should have the opposite balances for uniswap
      rollupState
        .getBalances(UNISWAP_ADDRESS)
        .uni.should.equal(
          genesisState[UNISWAP_ADDRESS].balances.uni + inputAmount
        )
      rollupState
        .getBalances(UNISWAP_ADDRESS)
        .pigi.should.equal(
          genesisState[UNISWAP_ADDRESS].balances.pigi - minOutputAmount
        )
    })
  })
})
