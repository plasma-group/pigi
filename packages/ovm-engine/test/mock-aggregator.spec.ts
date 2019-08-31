import './setup'

/* External Imports */
import { SimpleClient } from '@pigi/core'
import MemDown from 'memdown'
import * as assert from 'assert'

/* Internal Imports */
import {
  UnipigWallet,
  Address,
  UNISWAP_ADDRESS,
  UNI_TOKEN_TYPE,
  MockAggregator,
} from '../src'

/***********
 * HELPERS *
 ***********/

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

/*********
 * TESTS *
 *********/

describe('MockAggregator', async () => {
  let aggregator
  let client

  beforeEach(async () => {
    aggregator = new MockAggregator(
      JSON.parse(JSON.stringify(genesisState)),
      'localhost',
      3000
    )
    await aggregator.listen()
    // Connect to the mock aggregator
    client = new SimpleClient('http://127.0.0.1:3000')
  })

  afterEach(async () => {
    // Close the server
    await aggregator.close()
  })

  it('should allow the balance to be queried', async () => {
    const response = await client.handle('getBalances', 'alice')
    response.should.deep.equal({
      uni: 50,
      pigi: 50,
    })
  })

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
