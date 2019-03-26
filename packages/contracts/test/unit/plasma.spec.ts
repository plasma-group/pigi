import '../setup'

/* External Imports */
import { Contract } from 'web3-eth-contract'

/* Internal Imports */
import { Ethereum } from '../ethereum'
import { compiledPlasmaChain } from '../../src/compiled'
import { AssertionError } from 'assert';

describe('PlasmaChain', () => {
	let ethereum: Ethereum
    let snapshot: any
    let plasma: Contract
    before(async () => {
        console.log('ran')
        ethereum = new Ethereum()
        await ethereum.start()
        await ethereum.stop()
        plasma = await ethereum.deployCompiledContract(compiledPlasmaChain)
        console.log('oh')
        //console.log(plasma)
    })

    beforeEach(async () => {
        await ethereum.revert(snapshot)
    })

    after(async () => {
        await ethereum.stop()
    })

    it('lols', async() => {
        console.log('take2')
        console.log(plasma)
        true.should.equal(true)
    })
  
  // tests
})
