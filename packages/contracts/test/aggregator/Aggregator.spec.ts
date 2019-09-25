/* External Imports */
import chai = require('chai')
import {
  createMockProvider,
  deployContract,
  getWallets,
  solidity,
} from 'ethereum-waffle'

/* Contract Imports */
import * as Aggregator from '../../build/Aggregator.json'

/* Test setup */
chai.use(solidity)
const { expect } = chai

/* Begin tests */
describe('Aggregator', () => {
  const provider = createMockProvider()
  const [wallet] = getWallets(provider)
  let aggregator

  beforeEach(async () => {
    const authenticationAddress = wallet.address
    const id = 121
    aggregator = await deployContract(
      wallet,
      Aggregator,
      [authenticationAddress, id],
      {
        gasLimit: 6700000,
      }
    )
  })

  it('authenticationAddress()', async () => {
    expect(await aggregator.authenticationAddress()).to.eq(wallet.address)
  })

  it('id()', async () => {
    expect(await aggregator.id()).to.eq(121)
  })

  it('setMetadata(), deleteMetadata()', async () => {
    const addr = wallet.address
    await aggregator.setMetadata(addr, 'heyo')
    expect(await aggregator.metadata(addr)).to.eq('heyo')
    await aggregator.deleteMetadata(addr)
    expect(await aggregator.metadata(addr)).to.eq('')
  })
})
