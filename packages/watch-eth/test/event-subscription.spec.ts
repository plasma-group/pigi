import './setup'

const Web3 = require('web3')

import {
  createMockProvider,
  deployContract,
  getWallets,
} from 'ethereum-waffle'

/* Contract Imports */
const TestToken = require('./contracts/build/TestToken.json')

describe('Event Subscription', () => {
  const provider = createMockProvider()
  const wallets = getWallets(provider)
  const ownerWallet = wallets[0]
  const initialSupply = 100_000

  let web3
  let tokenContract

  beforeEach(async () => {
    web3 = await new Web3(provider)

    tokenContract = await deployContract(
      ownerWallet,
      TestToken,
      [initialSupply],
      {
        gasLimit: 6700000
      }
    )
  })

  it('deploys correctly', async () => {
    const ownerBalance = +(await tokenContract.balanceOf(ownerWallet.address))
    ownerBalance.should.equal(initialSupply)
  })

  it('subscribes to events', async () => {
    // TODO: Test emit events
  })
})