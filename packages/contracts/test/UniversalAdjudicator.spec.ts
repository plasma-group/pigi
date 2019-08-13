/* External Imports */
import { BigNumber } from '@pigi/core'
/* Contract Imports */
import { createMockProvider, deployContract, getWallets } from 'ethereum-waffle'
import * as BasicTokenMock from '../build/BasicTokenMock.json'
import * as Adjudicator from '../build/UniversalAdjudicator.json'
/* Logging */
import debug from 'debug'
import { check } from 'ethers/utils/wordlist'
const log = debug('test:info:Adjudicator')
/* Testing Setup */
import chai = require('chai')
export const should = chai.should()

/*
 * Helper Functions
 */
async function mineBlocks(provider: any, numBlocks: number = 1) {
  for (let i = 0; i < numBlocks; i++) {
    await provider.send('evm_mine', [])
  }
}

/*
 * Begin Tests
 */
describe('UniversalAdjudicator', () => {
  let provider
  let wallet
  let token
  let adjudicationContract

  beforeEach(async () => {
    provider = createMockProvider()
    const wallets = getWallets(provider)
    wallet = wallets[0]
    token = await deployContract(wallet, BasicTokenMock, [wallet.address, 1000])
    adjudicationContract = await deployContract(wallet, Adjudicator)
  })

  describe('ClaimProperty', () => {
    it('Adds a claim', async () => {
      const myClaim = {
        decider: '0x5a8cDc465fba0f4dC27aB2b6DA321AfeBbE5a0Aa',
        input: '0x01',
      }
      // Claim a property
      await adjudicationContract.claimProperty(myClaim)
      // Check that the property was stored
      const claimId = await adjudicationContract.getClaimId(myClaim)
      const claim = await adjudicationContract.getClaim(claimId)
      claim.decidedAfter.toNumber.should.not.equal(0)
    })
  })
})
