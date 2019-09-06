import './setup'

/* External Imports */
import { SimpleClient } from '@pigi/core'

/* Internal Imports */
import { getGenesisState } from './helpers'
import {
  UNISWAP_ADDRESS,
  UNI_TOKEN_TYPE,
  AGGREGATOR_ADDRESS,
  MockAggregator,
} from '../src'

/*********
 * TESTS *
 *********/

describe('MockAggregator', async () => {
  let aggregator
  let client

  beforeEach(async () => {
    aggregator = new MockAggregator(getGenesisState(), 'localhost', 3000)
    await aggregator.listen()
    // Connect to the mock aggregator
    client = new SimpleClient('http://127.0.0.1:3000')
  })

  afterEach(async () => {
    // Close the server
    await aggregator.close()
  })

  describe('getBalances', async () => {
    it('should allow the balance to be queried', async () => {
      const response = await client.handle('getBalances', 'alice')
      response.should.deep.equal({
        uni: 50,
        pigi: 50,
      })
    })
  })

  describe('applyTransaction', async () => {
    it('should update bobs balance using applyTransaction to send 5 tokens', async () => {
      const txAliceToBob = {
        signature: 'alice',
        transaction: {
          tokenType: UNI_TOKEN_TYPE,
          recipient: 'bob',
          amount: 5,
        },
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
