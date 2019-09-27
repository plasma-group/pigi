import './setup'
import { ethers } from 'ethers'

import { createMockProvider, getWallets } from 'ethereum-waffle'
import { EventListener } from './utils'
import { getLogger, newInMemoryDB, sleep } from '@pigi/core'
import { Event, EventProcessor } from '../src/event-processor'

/* Contract Imports */
const TestToken = require('./contracts/build/TestToken.json')

const log = getLogger('layer1-interaction', true)
const timeout = 10_000
describe('L1 Interaction', () => {
  const provider = createMockProvider()
  const wallets = getWallets(provider)
  const ownerWallet = wallets[0]
  const recipientWallet = wallets[1]
  const initialSupply = 100_000

  let tokenContract

  beforeEach(async () => {
    log.debug(`Connection info: ${JSON.stringify(provider.connection)}`)

    const factory = new ethers.ContractFactory(
      TestToken.abi,
      TestToken.bytecode,
      ownerWallet
    )

    // Notice we pass in "Hello World" as the parameter to the constructor
    tokenContract = await factory.deploy(initialSupply)

    tokenContract = await tokenContract.deployed()
    log.debug(`tokenContract: ${JSON.stringify(tokenContract.address)}`)
  })

  it('deploys correctly', async () => {
    const ownerBalance = +(await tokenContract.balanceOf(ownerWallet.address))
    ownerBalance.should.equal(initialSupply)
  })

  describe('Event Subscription', () => {
    let eventProcessor: EventProcessor
    let eventListener: EventListener
    const sendAmount = 100

    beforeEach(() => {
      eventProcessor = new EventProcessor(newInMemoryDB())
      eventListener = new EventListener()
    })

    it('processes new events', async () => {
      await eventProcessor.subscribe(tokenContract, 'Transfer', eventListener)

      await tokenContract.transfer(
        ownerWallet.address,
        recipientWallet.address,
        sendAmount
      )

      const events = await eventListener.waitForEvents()
      events.length.should.equal(1)
      const event: Event = events[0]
      event.values['from'].should.equal(ownerWallet.address)
      event.values['to'].should.equal(recipientWallet.address)
      event.values['amount'].toNumber().should.equal(sendAmount)
    }).timeout(timeout)

    it('processes old events', async () => {
      await tokenContract.transfer(
        ownerWallet.address,
        recipientWallet.address,
        sendAmount
      )

      await tokenContract.provider.send('evm_mine', {
        jsonrpc: '2.0',
        id: 0,
      })

      await eventProcessor.subscribe(tokenContract, 'Transfer', eventListener)

      const events = await eventListener.waitForEvents()
      events.length.should.equal(1)
      const event: Event = events[0]
      event.values['from'].should.equal(ownerWallet.address)
      event.values['to'].should.equal(recipientWallet.address)
      event.values['amount'].toNumber().should.equal(sendAmount)
    }).timeout(timeout)
  })
})
