import './setup'

/* External Imports */
import { Wallet } from 'ethers'

import {
  SimpleClient,
  newInMemoryDB,
  DefaultSignatureProvider,
} from '@pigi/core'
import { getLogger } from '@pigi/core-utils'

/* Internal Imports */
import {
  AGGREGATOR_ADDRESS,
  AGGREGATOR_MNEMONIC,
  DummyBlockSubmitter,
  DummyRollupStateSolver,
  getGenesisState,
} from './helpers'
import {
  AggregatorServer,
  DefaultRollupStateMachine,
  UnipigTransitioner,
  RollupAggregator,
  RollupStateMachine,
  UNI_TOKEN_TYPE,
  PIGI_TOKEN_TYPE,
  RollupClient,
  Balances,
} from '../src'

const log = getLogger('client-aggregator-integration', true)

/*********
 * TESTS *
 *********/

const timeout = 20_000
const testRecipientAddress = '0x7777b66b3C70137264BE7303812090EC42D85B4d'

describe('Mock Client/Aggregator Integration', () => {
  let accountAddress: string
  let aggregatorServer: AggregatorServer
  let aggregator: RollupAggregator
  let ovm: DummyRollupStateSolver
  let rollupClient: RollupClient
  let unipigTransitioner: UnipigTransitioner

  beforeEach(async function() {
    this.timeout(timeout)
    ovm = new DummyRollupStateSolver()
    rollupClient = new RollupClient(newInMemoryDB(), AGGREGATOR_ADDRESS)
    unipigTransitioner = new UnipigTransitioner(
      newInMemoryDB(),
      ovm,
      rollupClient,
      new DefaultSignatureProvider(),
      AGGREGATOR_ADDRESS
    )

    // Now create a wallet account
    accountAddress = await unipigTransitioner.getAddress()

    const rollupStateMachine: RollupStateMachine = await DefaultRollupStateMachine.create(
      getGenesisState(accountAddress),
      newInMemoryDB(),
      AGGREGATOR_ADDRESS
    )

    // Initialize a mock aggregator
    aggregator = await RollupAggregator.create(
      newInMemoryDB(),
      rollupStateMachine,
      new DummyBlockSubmitter(),
      new DefaultSignatureProvider(Wallet.fromMnemonic(AGGREGATOR_MNEMONIC))
    )

    // Assume we're in sync & initialized
    await aggregator.onSyncCompleted()

    aggregatorServer = new AggregatorServer(aggregator, 'localhost', 3000)

    await aggregatorServer.listen()
    // Connect to the mock aggregator
    rollupClient.connect(new SimpleClient('http://127.0.0.1:3000'))
  })

  afterEach(async () => {
    if (!!aggregator) {
      // Close the server
      await aggregatorServer.close()
    }
  })

  describe('UnipigTransitioner', () => {
    it('should be able to query the aggregators balances', async () => {
      const response = await unipigTransitioner.getBalances(accountAddress)
      response.should.deep.equal({
        [UNI_TOKEN_TYPE]: 50,
        [PIGI_TOKEN_TYPE]: 50,
      })
    }).timeout(timeout)

    it('should return an error if the wallet tries to transfer money it doesnt have', async () => {
      try {
        await unipigTransitioner.send(UNI_TOKEN_TYPE, testRecipientAddress, 10)
      } catch (err) {
        // Success!
      }
    }).timeout(timeout)

    it('should successfully transfer if alice sends money', async () => {
      await unipigTransitioner.send(UNI_TOKEN_TYPE, testRecipientAddress, 10)
      const recipientBalances: Balances = await unipigTransitioner.getBalances(
        testRecipientAddress
      )
      recipientBalances[UNI_TOKEN_TYPE].should.equal(10)
    }).timeout(timeout)

    it('should successfully transfer if first faucet is requested', async () => {
      const secondTransitioner = new UnipigTransitioner(
        newInMemoryDB(),
        ovm,
        rollupClient,
        new DefaultSignatureProvider(),
        AGGREGATOR_ADDRESS
      )
      const newAddress = await secondTransitioner.getAddress()

      // First collect some funds from the faucet
      await secondTransitioner.requestFaucetFunds(10)
      const balances: Balances = await secondTransitioner.getBalances(
        newAddress
      )
      balances.should.deep.equal({
        [UNI_TOKEN_TYPE]: 10,
        [PIGI_TOKEN_TYPE]: 10,
      })

      await secondTransitioner.send(UNI_TOKEN_TYPE, testRecipientAddress, 10)

      const recipientBalances: Balances = await secondTransitioner.getBalances(
        testRecipientAddress
      )
      recipientBalances[UNI_TOKEN_TYPE].should.equal(10)
    }).timeout(timeout)
  })
})
