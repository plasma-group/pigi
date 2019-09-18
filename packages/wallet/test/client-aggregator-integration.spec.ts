import './setup'

/* External Imports */
import { SimpleClient, BaseDB, DB, getLogger } from '@pigi/core'
import MemDown from 'memdown'

/* Internal Imports */
import { AGGREGATOR_MNEMONIC, getGenesisState } from './helpers'
import {
  DefaultRollupStateMachine,
  UnipigWallet,
  RollupAggregator,
  RollupStateMachine,
  FaucetRequest,
  UNI_TOKEN_TYPE,
  PIGI_TOKEN_TYPE,
  SignedStateReceipt,
} from '../src'

const log = getLogger('client-aggregator-integration', true)

/*********
 * TESTS *
 *********/

const timeout = 20_000
const testRecipientAddress = '0x7777b66b3C70137264BE7303812090EC42D85B4d'

describe('Mock Client/Aggregator Integration', () => {
  let stateDB: DB
  let blockDB: DB
  let accountAddress: string
  let aggregator: RollupAggregator
  let unipigWallet: UnipigWallet
  let stateMemdown: any
  let blockMemdown: any
  const walletPassword = 'Really great password'

  beforeEach(async function() {
    this.timeout(timeout)

    stateMemdown = new MemDown('state') as any
    stateDB = new BaseDB(stateMemdown)
    blockMemdown = new MemDown('block') as any
    blockDB = new BaseDB(blockMemdown, 256)
    unipigWallet = new UnipigWallet(stateDB)

    // Now create a wallet account
    accountAddress = await unipigWallet.createAccount(walletPassword)

    const rollupStateMachine: RollupStateMachine = await DefaultRollupStateMachine.create(
      getGenesisState(accountAddress),
      stateDB
    )

    // Initialize a mock aggregator
    await unipigWallet.unlockAccount(accountAddress, walletPassword)
    aggregator = new RollupAggregator(
      blockDB,
      rollupStateMachine,
      'localhost',
      3000,
      AGGREGATOR_MNEMONIC
    )

    await aggregator.listen()
    // Connect to the mock aggregator
    unipigWallet.rollup.connect(new SimpleClient('http://127.0.0.1:3000'))
  })

  afterEach(async () => {
    if (!!aggregator) {
      // Close the server
      await aggregator.close()
    }
    await stateDB.close()
    stateMemdown = undefined
    await blockDB.close()
    blockMemdown = undefined
  })

  describe('UnipigWallet', () => {
    it('should be able to query the aggregators balances', async () => {
      const response = await unipigWallet.getBalances(accountAddress)
      response.should.deep.equal({
        [UNI_TOKEN_TYPE]: 50,
        [PIGI_TOKEN_TYPE]: 50,
      })
    }).timeout(timeout)

    it('should return an error if the wallet tries to transfer money it doesnt have', async () => {
      try {
        await unipigWallet.rollup.sendTransaction(
          {
            sender: accountAddress,
            tokenType: UNI_TOKEN_TYPE,
            recipient: testRecipientAddress,
            amount: 10,
          },
          accountAddress
        )
      } catch (err) {
        // Success!
      }
    }).timeout(timeout)

    it('should successfully transfer if alice sends money', async () => {
      const response: SignedStateReceipt[] = await unipigWallet.rollup.sendTransaction(
        {
          sender: accountAddress,
          tokenType: UNI_TOKEN_TYPE,
          recipient: testRecipientAddress,
          amount: 10,
        },
        accountAddress
      )
      response[1].stateReceipt.state.balances[UNI_TOKEN_TYPE].should.equal(10)
    }).timeout(timeout)

    it('should successfully transfer if first faucet is requested', async () => {
      const newPassword = 'new address password'
      const newAddress = await unipigWallet.createAccount(newPassword)
      await unipigWallet.unlockAccount(newAddress, newPassword)

      // Request some money for new wallet
      const transaction: FaucetRequest = {
        sender: newAddress,
        amount: 10,
      }

      // First collect some funds from the faucet
      const faucetRes: SignedStateReceipt = await unipigWallet.rollup.requestFaucetFunds(
        transaction,
        newAddress
      )
      faucetRes.stateReceipt.state.balances.should.deep.equal({
        [UNI_TOKEN_TYPE]: 10,
        [PIGI_TOKEN_TYPE]: 10,
      })

      const transferRes: SignedStateReceipt[] = await unipigWallet.rollup.sendTransaction(
        {
          sender: newAddress,
          recipient: testRecipientAddress,
          tokenType: UNI_TOKEN_TYPE,
          amount: 10,
        },
        newAddress
      )
      transferRes[1].stateReceipt.state.balances[UNI_TOKEN_TYPE].should.equal(
        10
      )
    }).timeout(timeout)
  })
})
