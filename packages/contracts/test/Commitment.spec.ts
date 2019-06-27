/* External Imports */
import {
  GenericMerkleIntervalTree,
  AbiStateSubtreeNode,
  AbiAssetTreeNode,
  MerkleStateIntervalTree,
} from '@pigi/core'
import BigNum = require('bn.js')

/* Contract Imports */
import { createMockProvider, deployContract, getWallets } from 'ethereum-waffle'
import * as Commitment from '../build/CommitmentChain.json'
/* Logging */
import debug from 'debug'
import { check } from 'ethers/utils/wordlist'
const log = debug('test:info:state-ownership')
/* Testing Setup */
import chai = require('chai')
export const should = chai.should()

describe.only('Commitment Contract', () => {
  const provider = createMockProvider()
  const [wallet, walletTo] = getWallets(provider)
  let commitmentContract

  beforeEach(async () => {
    commitmentContract = await deployContract(wallet, Commitment, [])
  })

  describe('Verification Components', () => {
    it('correctly calculates a stateSubtreeParent', async () => {
      const leftSibling = new AbiStateSubtreeNode(
        Buffer.from(
          '1111111111111111111111111111111111111111111111111111111111111111',
          'hex'
        ),
        Buffer.from('00000000000000000000000000000000', 'hex')
      )
      const rightSibling = new AbiStateSubtreeNode(
        Buffer.from(
          '2222222222222222222222222222222222222222222222222222222222222222',
          'hex'
        ),
        Buffer.from('00000000000000000000000000000001', 'hex')
      )
      const contractParent = await commitmentContract.stateSubtreeParent(
        leftSibling.jsonified,
        rightSibling.jsonified
      )
      const ovmParent = GenericMerkleIntervalTree.parent(
        leftSibling,
        rightSibling
      )
      contractParent.hashValue.should.equal('0x' + ovmParent.hash.toString('hex'))
      new BigNum(contractParent.lowerBound.toString('hex'), 'hex').eq(
          new BigNum(ovmParent.lowerBound)
        ).should.equal(true) // horibly messy way to compare equality
    })
    it('correctly calculates an assetTreeParent', async () => {
        const leftSibling = new AbiAssetTreeNode(
          Buffer.from(
            '1111111111111111111111111111111111111111111111111111111111111111',
            'hex'
          ),
          Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')
        )
        const rightSibling = new AbiAssetTreeNode(
          Buffer.from(
            '2222222222222222222222222222222222222222222222222222222222222222',
            'hex'
          ),
          Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
        )
        const contractParent = await commitmentContract.assetTreeParent(
          leftSibling.jsonified,
          rightSibling.jsonified
        )
        const ovmParent = GenericMerkleIntervalTree.parent(
          leftSibling,
          rightSibling
        )
        contractParent.hashValue.should.equal('0x' + ovmParent.hash.toString('hex'))
        new BigNum(contractParent.lowerBound.toString('hex'), 'hex').eq(
            new BigNum(ovmParent.lowerBound)
          ).should.equal(true) // horibly messy way to compare equality
      })
  })
})
