import '../setup'

/* External Imports */
import { Contract } from 'web3-eth-contract'
import debug from 'debug'
const log = debug('test:info:contract')

/* Internal Imports */
import { Ethereum } from '../ethereum'
import { compiledPlasmaChain, compiledNewPlasma } from '../../src/compiled'
import { AssertionError } from 'assert';

describe('PlasmaChainContract', () => {
  let ethereum: Ethereum
  let snapshot: any
  let plasma: Contract
  before(async () => {
    ethereum = new Ethereum()
    await ethereum.start()
    plasma = await ethereum.deployCompiledContract(compiledPlasmaChain)
    snapshot = await ethereum.snapshot()
  })

  beforeEach(async () => {
    await ethereum.revert(snapshot)
  })

  after(async () => {
    await ethereum.stop()
  })

  it('should pass tests that dont test anything', async() => {
    true.should.equal(true)
  })
})
