/* External Imports */
import {
  AbiStateUpdate,
  AbiStateObject,
  AbiRange,
  GenericMerkleIntervalTree,
  AbiStateSubtreeNode,
  AbiAssetTreeNode,
  MerkleStateIntervalTree,
  PlasmaBlock
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

function generateNSequentialStateUpdates(
  numerOfUpdates: number
): AbiStateUpdate[] {
  const stateUpdates: AbiStateUpdate[] = []
  for (let i = 0; i < numerOfUpdates; i++) {
    const stateObject = new AbiStateObject(
      '0xbdAd2846585129Fc98538ce21cfcED21dDDE0a63',
      '0x123456'
    )
    const range = new AbiRange(new BigNum(i * 100), new BigNum((i + 0.5) * 100))
    const stateUpdate = new AbiStateUpdate(
      stateObject,
      range,
      new BigNum(1),
      '0xbdAd2846585129Fc98538ce21cfcED21dDDE0a63'
    )
    stateUpdates.push(stateUpdate)
  }
  return stateUpdates
}

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
      it('correctly parses calculateStateUpdateLeaf', async () => {
        const stateUpdateToParse = generateNSequentialStateUpdates(1)[0]
        
        const contractLeaf = await commitmentContract.calculateStateUpdateLeaf(stateUpdateToParse.jsonified)
        const ovmLeaf = MerkleStateIntervalTree.calculateStateUpdateLeaf(stateUpdateToParse)        
        
        contractLeaf.hashValue.should.equal('0x' + ovmLeaf.hash.toString('hex'))
        contractLeaf.lowerBound.should.equal('0x' + ovmLeaf.lowerBound.toString('hex'))
      })
      it.only('correctly calculates stateSubtree root', async () => {
        const numUpdatesInSubtree = 10
        const stateUpdates = generateNSequentialStateUpdates(numUpdatesInSubtree)
        const blockContents = [
          {
            assetId: Buffer.from(
              '1dAd2846585129Fc98538ce21cfcED21dDDE0a63',
              'hex'
            ),
            stateUpdates,
          }
        ]
        const plasmaBlock = new PlasmaBlock(blockContents)
        const SUindex = 7
        const subtreeIndex = 0
        const stateUpdate = stateUpdates[SUindex]
        const proof = plasmaBlock.getStateUpdateInclusionProof(SUindex, subtreeIndex)
        const contractRoot = await commitmentContract.verifySubtreeInclusionAndGetRoot(stateUpdate.jsonified, proof.jsonified)
        const ovmRoot = plasmaBlock.subtrees[subtreeIndex].root()
        contractRoot.should.equal('0x' + ovmRoot.hash.toString('hex'))
      })
      it.skip('correctly gets the binary path from a leafPosition', async () => {
        let bit = await commitmentContract.getNthBitFromRightmost(5, 0)
        console.log('5, 0 bit is: ', bit)
        bit = await commitmentContract.getNthBitFromRightmost(5, 1)
        console.log('5, 1 bit is: ', bit)
        bit = await commitmentContract.getNthBitFromRightmost(5, 2)
        console.log('5, 2 bit is: ', bit)
        bit = await commitmentContract.getNthBitFromRightmost(5, 20)
        console.log('5, 20 bit is: ', bit)
        bit = await commitmentContract.getNthBitFromRightmost(5, 21)
        console.log('5, 21 bit is: ', bit)
        bit = await commitmentContract.getNthBitFromRightmost(5, 22)
        console.log('5, 22 bit is: ', bit)
        bit = await commitmentContract.getNthBitFromRightmost(5, 23)
        console.log('5, 23 bit is: ', bit)
      })
  })
})
