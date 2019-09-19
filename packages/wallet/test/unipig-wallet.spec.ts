import './setup'

/* External Imports */
import { SimpleServer, SimpleClient, DB, newInMemoryDB } from '@pigi/core'

/* Internal Imports */
import {
  UnipigWallet,
  Address,
  SignedTransaction,
  SignedStateReceipt,
  UNI_TOKEN_TYPE,
  PIGI_TOKEN_TYPE,
  EMPTY_AGGREGATOR_SIGNATURE,
  NON_EXISTENT_SLOT_INDEX,
  StateReceipt,
  RollupClient,
} from '../src'
import { DummyRollupOVM } from './helpers'

/***********
 * HELPERS *
 ***********/

const getStateReceipt = (pubKey: Address): StateReceipt => {
  return {
    slotIndex: NON_EXISTENT_SLOT_INDEX,
    stateRoot: 'mocked',
    inclusionProof: [],
    blockNumber: 1,
    transitionIndex: 0,
    state: {
      pubKey,
      balances: {
        [UNI_TOKEN_TYPE]: 5,
        [PIGI_TOKEN_TYPE]: 10,
      },
    },
  }
}

// A mocked getState api
const getState = (pubKey: Address): SignedStateReceipt => {
  return {
    signature: EMPTY_AGGREGATOR_SIGNATURE,
    stateReceipt: getStateReceipt(pubKey),
  }
}

// A mocked applyTransaction function
const applyTransaction = (transaction: SignedTransaction) => {
  // TODO
}

/*********
 * TESTS *
 *********/

describe('UnipigWallet', async () => {
  let unipigWallet: UnipigWallet
  let accountAddress: Address
  let aggregator: SimpleServer
  let ovm: DummyRollupOVM
  let rollupClient: RollupClient

  const timeout = 20_000
  beforeEach(async () => {
    // Typings for MemDown are wrong so we need to cast to `any`.
    ovm = new DummyRollupOVM()
    rollupClient = new RollupClient(newInMemoryDB())
    unipigWallet = new UnipigWallet(newInMemoryDB(), ovm, rollupClient)
    // Now create a wallet account
    accountAddress = await unipigWallet.createAccount('')
    // Initialize a mock aggregator
    aggregator = new SimpleServer(
      {
        getState,
      },
      'localhost',
      3000
    )
    await aggregator.listen()
    // Connect to the mock aggregator
    rollupClient.connect(new SimpleClient('http://127.0.0.1:3000'))
  })

  afterEach(async () => {
    // Close the server
    await aggregator.close()
  })

  describe('getState()', () => {
    it('should return an empty balance after initialized', async () => {
      const result: StateReceipt = await unipigWallet.getState(accountAddress)
      result.should.deep.equal(getStateReceipt(accountAddress))
    }).timeout(timeout)
  })
})
