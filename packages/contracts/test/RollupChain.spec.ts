import './setup'

/* Internal Imports */
import { Transition, abiEncodeTransition } from './utils'

/* External Imports */
import {
  createMockProvider,
  deployContract,
  link,
  getWallets,
} from 'ethereum-waffle'
import { MerkleTree } from 'merkletreejs'
import { keccak256, abi, hexStrToBuf, bufToHexString } from '@pigi/core'

/* Contract Imports */
import * as RollupChain from '../build/RollupChain.json'
import * as RollupMerkleUtils from '../build/RollupMerkleUtils.json'

/* Begin tests */
describe('RollupChain', () => {
  const provider = createMockProvider()
  const [wallet1] = getWallets(provider)
  let rollupChain
  let rollupMerkleUtils

  /* Link libraries before tests */
  before(async () => {
    rollupMerkleUtils = await deployContract(wallet1, RollupMerkleUtils, [], {
      gasLimit: 6700000,
    })
    // Link attaches the library to the RollupChain contract.
    link(
      RollupChain,
      // NOTE: This path is in relation to `waffle-config.json`
      'contracts/RollupMerkleUtils.sol:RollupMerkleUtils',
      rollupMerkleUtils.address
    )
  })

  /* Deploy a new RollupChain before each test */
  beforeEach(async () => {
    rollupChain = await deployContract(wallet1, RollupChain, [], {
      gasLimit: 6700000,
    })
  })

  describe('submitBlock() ', async () => {
    const exampleTransition: Transition = {
      transaction: '0x1234',
      postState: '0x' + '00'.repeat(32),
    }
    const encodedTransition = bufToHexString(
      abiEncodeTransition(exampleTransition)
    )
    it('should not throw', async () => {
      await rollupChain.submitBlock([encodedTransition, encodedTransition])
      // Did not throw... success!
    })
  })
})
