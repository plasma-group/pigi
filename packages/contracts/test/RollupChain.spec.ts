import './setup'

/* External Imports */
import { createMockProvider, deployContract, getWallets } from 'ethereum-waffle'

/* Contract Imports */
import * as RollupChain from '../build/RollupChain.json'

/* Begin tests */
describe.only('RollupChain', () => {
  const provider = createMockProvider()
  const [wallet1] = getWallets(provider)
  let rollupChain

  beforeEach(async () => {
    const agg1AuthenticationAddress = wallet1.address
    rollupChain = await deployContract(wallet1, RollupChain, [], {
      gasLimit: 6700000,
    })
  })

  describe('submitBlock() ', async () => {
    it('should not throw', async () => {
      const exampleTransition = {
        transaction: '0x1234',
        postState: '0x' + '00'.repeat(32),
      }
      await rollupChain.submitBlock([exampleTransition, exampleTransition])
    })
  })
})
