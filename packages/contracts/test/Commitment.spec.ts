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
import { createMockProvider, deployContract, getWallets, solidity } from 'ethereum-waffle'
import * as Commitment from '../build/CommitmentChain.json'
/* Logging */
import debug from 'debug'
import { check } from 'ethers/utils/wordlist'
const log = debug('test:info:state-ownership')
/* Testing Setup */
import chai = require('chai')
chai.use(solidity)
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
    describe('stateSubtreeParent', () => {
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
      const ovmParent = GenericMerkleIntervalTree.parent(
        leftSibling,
        rightSibling
      )
      it('should correctly calculate a state subtree parent', async () => {
        const contractParent = await commitmentContract.stateSubtreeParent(
          leftSibling.jsonified,
          rightSibling.jsonified
        )
        contractParent.hashValue.should.equal('0x' + ovmParent.hash.toString('hex'))
        new BigNum(contractParent.lowerBound.toString('hex'), 'hex').eq(
          new BigNum(ovmParent.lowerBound)
        ).should.equal(true) // horibly messy way to compare equality
      })
      it('should throw if given siblings out of order', async () => {
        // do parent(right, left) instead of (left, right)
        chai.expect(commitmentContract.stateSubtreeParent(
          rightSibling.jsonified,
          leftSibling.jsonified
        )).to.be.revertedWith('Interval tree siblings must be ordered to have a valid parent.')
      })
    })
    describe('assetTreeParent', () => {
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
        const ovmParent = GenericMerkleIntervalTree.parent(
          leftSibling,
          rightSibling
        )
        it('should correctly calculate an asset tree parent', async () => {
          const contractParent = await commitmentContract.assetTreeParent(
            leftSibling.jsonified,
            rightSibling.jsonified
          )
          contractParent.hashValue.should.equal('0x' + ovmParent.hash.toString('hex'))
          new BigNum(contractParent.lowerBound.toString('hex'), 'hex').eq(
              new BigNum(ovmParent.lowerBound)
            ).should.equal(true) // horibly messy way to compare equality
          })
          it('should throw if given siblings out of order', async () => {
            // do parent(right, left) instead of (left, right)
            chai.expect(commitmentContract.assetTreeParent(
              rightSibling.jsonified,
              leftSibling.jsonified
            )).to.be.revertedWith('Interval tree siblings must be ordered to have a valid parent.')
          })
      })
      it('calculateStateUpdateLeaf', async () => {
        const stateUpdateToParse = generateNSequentialStateUpdates(1)[0]
        
        const contractLeaf = await commitmentContract.calculateStateUpdateLeaf(stateUpdateToParse.jsonified)
        const ovmLeaf = MerkleStateIntervalTree.calculateStateUpdateLeaf(stateUpdateToParse)        
        
        contractLeaf.hashValue.should.equal('0x' + ovmLeaf.hash.toString('hex'))
        contractLeaf.lowerBound.should.equal('0x' + ovmLeaf.lowerBound.toString('hex'))
      })
      describe('verifySubtreeInclusionAndGetRoot', async () => {
        it('correctly gets the binary path from a leafPosition', async () => {
          let bit = await commitmentContract.getNthBitFromRightmost(5, 0)
          bit.should.equal(1)
          bit = await commitmentContract.getNthBitFromRightmost(5, 1)
          bit.should.equal(0)
          bit = await commitmentContract.getNthBitFromRightmost(5, 2)
          bit.should.equal(1)
          bit = await commitmentContract.getNthBitFromRightmost(5, 20)
          bit.should.equal(0)
        })
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
        const ovmRoot = plasmaBlock.subtrees[subtreeIndex].root()
        it('correctly calculates a root', async () => {
          const contractRoot = await commitmentContract.verifySubtreeInclusionAndGetRoot(stateUpdate.jsonified, proof.jsonified)
          contractRoot.should.equal('0x' + ovmRoot.hash.toString('hex'))
        })
        it('throws if the SU.end is greater than first right sibling ', async () => {
          const faultyEndSU = new AbiStateUpdate(
            stateUpdate.stateObject,
            new AbiRange(
              stateUpdate.range.start,
              stateUpdate.range.end.add(new BigNum(1000))
            ),
            stateUpdate.plasmaBlockNumber,
            stateUpdate.depositAddress
          )
          chai.expect(commitmentContract.verifySubtreeInclusionAndGetRoot(
            faultyEndSU.jsonified,
            proof.jsonified
          )).to.be.revertedWith('No valid branch allows potential intersections with other branches.')
        })
      })
  })
})
