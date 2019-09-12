import '../setup'
import MemDown from 'memdown'

/* External Imports */
import { BaseDB, DB, SimpleClient } from '@pigi/core'

/* Internal Imports */
import { ethers } from 'ethers'
import { MockAggregator } from '../../src/mock'
import { AGGREGATOR_MNEMONIC, getGenesisState } from '../helpers'
import { UNI_TOKEN_TYPE, DefaultRollupStateMachine } from '../../src'
import { RollupStateMachine } from '../../src/types'

/*********
 * TESTS *
 *********/

describe('MockAggregator', async () => {
  let client
  let aggregator: MockAggregator
  let stateDB: DB
  let blockDB: DB

  let aliceWallet: ethers.Wallet

  beforeEach(async () => {
    aliceWallet = ethers.Wallet.createRandom()
    stateDB = new BaseDB(new MemDown('state') as any)
    blockDB = new BaseDB(new MemDown('block') as any)

    const rollupStateMachine: RollupStateMachine = await DefaultRollupStateMachine.create(
      getGenesisState(aliceWallet.address),
      stateDB
    )

    aggregator = new MockAggregator(
      blockDB,
      rollupStateMachine,
      'localhost',
      3000,
      AGGREGATOR_MNEMONIC
    )
    await aggregator.listen()
    // Connect to the mock aggregator
    client = new SimpleClient('http://127.0.0.1:3000')
  })

  afterEach(async () => {
    // Close the server
    await aggregator.close()
    await stateDB.close()
    await blockDB.close()
  })

  describe('getBalances', async () => {
    it('should allow the balance to be queried', async () => {
      const response = await client.handle('getBalances', aliceWallet.address)
      response.should.deep.equal({
        uni: 50,
        pigi: 50,
      })
    })
  })

  describe('applyTransaction', async () => {
    it('should update bobs balance using applyTransaction to send 5 tokens', async () => {
      const transaction = {
        tokenType: UNI_TOKEN_TYPE,
        recipient: 'bob',
        amount: 5,
      }
      const signature = await aliceWallet.signMessage(
        JSON.stringify(transaction)
      )
      const txAliceToBob = {
        signature,
        transaction,
      }
      // Send some money to bob
      await client.handle('applyTransaction', txAliceToBob)
      // Make sure bob got the money!
      const bobBalances = await client.handle('getBalances', 'bob')
      bobBalances.uni.should.equal(5)
    })
  })

  describe('requestFaucetFunds', async () => {
    it('should send money to the account who requested', async () => {
      // Request some money for bob
      await client.handle('requestFaucetFunds', ['bob', 10])
      // Make sure bob got the money!
      const bobBalances = await client.handle('getBalances', 'bob')
      bobBalances.uni.should.equal(10)
      bobBalances.pigi.should.equal(10)
    })
  })
})
