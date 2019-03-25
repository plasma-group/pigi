import './setup'

/* External Imports */
import { Contract } from 'web3-eth-contract/types'

/* Internal Imports */
import { Ethereum } from '../ethereum'
import { compiledPlasmaChain } from '../../src/compiled'

describe('PlasmaChain', () => {
	let ethereum: Ethereum
  let snapshot: any
  let plasma: Contract
	before(async () => {
  	ethereum = new Ethereum()
    await ethereum.start()
    { snapshot, plasma } = await ethereum.deploy(compiledPlasmaChain.bytecode)
	})

  beforeEach(async () => {
		await ethereum.revert(snapshot)
  })

  after(async () => {
    await ethereum.stop()
  })
  
  // tests
})
