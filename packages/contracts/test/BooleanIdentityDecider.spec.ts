/* External Imports */
import { abi, BigNumber } from '@pigi/core'
/* Contract Imports */
import { createMockProvider, deployContract, getWallets } from 'ethereum-waffle'
import * as BasicTokenMock from '../build/BasicTokenMock.json'
import * as Adjudicator from '../build/UniversalAdjudicator.json'
import * as BooleanIdentityDecider from '../build/BooleanIdentityDecider.json'
/* Logging */
import debug from 'debug'
import { check } from 'ethers/utils/wordlist'
const log = debug('test:info:BooleanIdentityDecider')
/* Testing Setup */
import chai = require('chai')
export const should = chai.should()

/*
 * Begin Tests
 */
describe('BooleanIdentityDecider', () => {
  let provider
  let wallet
  let token
  let adjudicationContract
  let booleanIdentityDecider

  beforeEach(async () => {
    provider = createMockProvider()
    const wallets = getWallets(provider)
    wallet = wallets[0]
    token = await deployContract(wallet, BasicTokenMock, [wallet.address, 1000])
    // Depoy our adjudication contract
    adjudicationContract = await deployContract(wallet, Adjudicator)
    // Next deploy a BooleanIdentityDecider for easy testing!
    booleanIdentityDecider = await deployContract(
      wallet,
      BooleanIdentityDecider,
      [adjudicationContract.address]
    )
  })

  describe('decideTrue', () => {
    it('Decides the true input property true', async () => {
      // Get the claimId for the claim we will be testing
      const claimId = await adjudicationContract.getClaimId({
        decider: booleanIdentityDecider.address,
        input: abi.encode(['bool'], [true]),
      })
      // Verify that this claim doesn't already exists
      const doesClaimExist = await adjudicationContract.claimExists(claimId)
      doesClaimExist.should.equal(false)
      // Now that we know our claim doesn't exist, let's decideTrue!
      await booleanIdentityDecider.decideTrue({ inputBool: true }, '0x')
      // Check if we've decided this claim -- it should have!
      const isDecided = await adjudicationContract.isDecided(claimId)
      isDecided.should.equal(true)
    })
  })

  describe('decideFalse', () => {
    it('Decides the false input property false', async () => {
      // Get the claimId for the claim we will be testing
      const claimId = await adjudicationContract.getClaimId({
        decider: booleanIdentityDecider.address,
        input: abi.encode(['bool'], [false]),
      })
      // Verify that this claim doesn't already exists
      const doesClaimExist = await adjudicationContract.claimExists(claimId)
      doesClaimExist.should.equal(false)
      // Now that we know our claim doesn't exist, let's decideFalse!
      await booleanIdentityDecider.decideFalse({ inputBool: false }, '0x')
      // Check if we've decided this claim -- it should have!
      const isDecided = await adjudicationContract.isDecided(claimId)
      isDecided.should.equal(true)
    })
  })
})
