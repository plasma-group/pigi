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
      uni: 100,
      pigi: 100,
    },
  },
  karl: {
    balances: {
      uni: 50,
      pigi: 50,
    },
  },
}

describe.only('RollupStateMachine', async () => {
  let rollupState
  beforeEach(() => {
    rollupState = new MockRollupStateMachine(genesisState)
  })

  describe('transfer', async () => {
    it('should not throw when karl sends 5 uni', () => {
      rollupState.getBalances('karl').should.deep.equal(genesisState.karl.balances)
      const result = rollupState.applyTransaction({
        signature: 'karl',
        transaction: {
          tokenType: UNI_TOKEN_TYPE,
          recipient: 'alice',
          amount: 5,
        },
      })
      console.log(result)
      // rollupState.getBalances('karl').should.deep.equal(genesisState.karl-5)
      // rollupState.getBalances('alice').should.deep.equal(genesisState.karl+5)
    })
  })
})
