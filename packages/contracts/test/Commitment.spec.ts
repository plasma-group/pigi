/* External Imports */
import {
  AbiStateUpdate,
  AbiStateObject,
  AbiRange,
  GenericMerkleIntervalTree,
  AbiStateSubtreeNode,
  AbiAssetTreeNode,
  MerkleStateIntervalTree,
  PlasmaBlock,
} from '@pigi/core'
import BigNum = require('bn.js')

/* Contract Imports */
import {
  createMockProvider,
  deployContract,
  getWallets,
  solidity,
} from 'ethereum-waffle'
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

function generatePlasmaBlockOfSize(
  numUpdatesPerSubtree: number,
  numOfDepositAddress: number
): PlasmaBlock {
  let blockContents = []
  for (let i = 0; i < numOfDepositAddress; i++) {
    const randomNum = Math.random() * 1000
    const randomAssetId = new BigNum(randomNum).toBuffer('be', 32)
    const stateUpdates = []
    for (let j = 0; j < numUpdatesPerSubtree; j++) {
      stateUpdates.push(
        new AbiStateUpdate(
          new AbiStateObject(
            '0xbdAd2846585129Fc98538ce21cfcED21dDDE0a63',
            '0x123456'
          ),
          new AbiRange(new BigNum(j * 100), new BigNum((j + 0.5) * 100)),
          new BigNum(0),
          '0x' + randomAssetId.toString('hex').slice(24)
        )
      )
    }
    blockContents.push({
      assetId: randomAssetId,
      stateUpdates,
    })
  }
  blockContents = blockContents.sort((c1, c2) =>
    Buffer.compare(c1.assetId, c2.assetId)
  )
  return new PlasmaBlock(blockContents)
}

describe('Commitment Contract', () => {
  const provider = createMockProvider()
  const [wallet, walletTo] = getWallets(provider)
  let commitmentContract

  beforeEach(async () => {
    commitmentContract = await deployContract(wallet, Commitment, [
      wallet.address,
    ])
  })

  describe('Verification Components', () => {
    describe('stateSubtreeParent', () => {
      const leftSibling = new AbiStateSubtreeNode(
        Buffer.from(
          '0000111111111111111111111111111111111111111111111111111111111111',
          'hex'
        ),
        Buffer.from('00000000000000000000000000000000', 'hex')
      )
      const rightSibling = new AbiStateSubtreeNode(
        Buffer.from(
          '0000222222222222222222222222222222222222222222222222222222222222',
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
        contractParent.hashValue.should.equal(
          '0x' + ovmParent.hash.toString('hex')
        )
        new BigNum(contractParent.lowerBound.toString('hex'), 'hex')
          .eq(new BigNum(ovmParent.lowerBound))
          .should.equal(true) // horibly messy way to compare equality
      })
      it('should throw if given siblings out of order', async () => {
        // do parent(right, left) instead of (left, right)
        chai
          .expect(
            commitmentContract.stateSubtreeParent(
              rightSibling.jsonified,
              leftSibling.jsonified
            )
          )
          .to.be.revertedWith(
            'Interval tree siblings must be ordered to have a valid parent.'
          )
      })
    })
    describe('assetTreeParent', () => {
      const leftSibling = new AbiAssetTreeNode(
        Buffer.from(
          '0000111111111111111111111111111111111111111111111111111111111111',
          'hex'
        ),
        Buffer.from(
          '0000000000000000000000000000000000000000000000000000000000000001',
          'hex'
        )
      )
      const rightSibling = new AbiAssetTreeNode(
        Buffer.from(
          '2222222222222222222222222222222222222222222222222222222222222222',
          'hex'
        ),
        Buffer.from(
          '0000000000000000000000000000000000000000000000000000000000000011',
          'hex'
        )
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
        contractParent.hashValue.should.equal(
          '0x' + ovmParent.hash.toString('hex')
        )
        new BigNum(contractParent.lowerBound.toString('hex'), 'hex')
          .eq(new BigNum(ovmParent.lowerBound))
          .should.equal(true) // horibly messy way to compare equality
      })
      it('should throw if given siblings out of order', async () => {
        // do parent(right, left) instead of (left, right)
        chai
          .expect(
            commitmentContract.assetTreeParent(
              rightSibling.jsonified,
              leftSibling.jsonified
            )
          )
          .to.be.revertedWith(
            'Interval tree siblings must be ordered to have a valid parent.'
          )
      })
    })
    it('calculateStateUpdateLeaf', async () => {
      const stateUpdateToParse = generateNSequentialStateUpdates(1)[0]

      const contractLeaf = await commitmentContract.calculateStateUpdateLeaf(
        stateUpdateToParse.jsonified
      )
      const ovmLeaf = MerkleStateIntervalTree.calculateStateUpdateLeaf(
        stateUpdateToParse
      )

      contractLeaf.hashValue.should.equal('0x' + ovmLeaf.hash.toString('hex'))
      contractLeaf.lowerBound.should.equal(
        '0x' + ovmLeaf.lowerBound.toString('hex')
      )
    })
    describe('verifySubtreeInclusionAndGetRoot', async () => {
      it('correctly gets the binary path from a leafPosition', async () => {
        let bit = await commitmentContract.getNthBitFromRight(5, 0)
        bit.should.equal(1)
        bit = await commitmentContract.getNthBitFromRight(5, 1)
        bit.should.equal(0)
        bit = await commitmentContract.getNthBitFromRight(5, 2)
        bit.should.equal(1)
        bit = await commitmentContract.getNthBitFromRight(5, 20)
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
        },
      ]
      const plasmaBlock = new PlasmaBlock(blockContents)
      const SUindex = 7
      const subtreeIndex = 0
      const stateUpdate = stateUpdates[SUindex]
      const proof = plasmaBlock.getStateUpdateInclusionProof(
        SUindex,
        subtreeIndex
      )
      const ovmRoot = plasmaBlock.subtrees[subtreeIndex].root()
      it('correctly calculates a root', async () => {
        const contractRoot = await commitmentContract.verifySubtreeInclusionAndGetRoot(
          stateUpdate.jsonified,
          proof.jsonified.stateTreeInclusionProof
        )
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
        chai
          .expect(
            commitmentContract.verifySubtreeInclusionAndGetRoot(
              faultyEndSU.jsonified,
              proof.jsonified.stateTreeInclusionProof
            )
          )
          .to.be.revertedWith(
            'No valid branch allows potential intersections with other branches.'
          )
      })
    })
    describe('verifyAssetTreeInclusionAndGetRoot', () => {
      const numUpdatesPerSubtree = 1
      const numStateSubtrees = 5
      const block = generatePlasmaBlockOfSize(
        numUpdatesPerSubtree,
        numStateSubtrees
      )
      const ovmRoot = block.root()
      const subtreeIndex = 3
      const subtreeRoot =
        '0x' + block.subtrees[subtreeIndex].root().hash.toString('hex')
      const depositAddress =
        '0x' +
        block.levels[0][subtreeIndex].lowerBound.toString('hex').slice(24)
      const proof = block.getStateUpdateInclusionProof(0, subtreeIndex)
      it('should calculate the right root', async () => {
        const contractRoot = await commitmentContract.verifyAssetTreeInclusionAndGetRoot(
          subtreeRoot,
          depositAddress,
          proof.jsonified.assetTreeInclusionProof
        )
        contractRoot.should.equal('0x' + ovmRoot.hash.toString('hex'))
      })
    })
  })
  describe('Block Submission', () => {
    it('allows getBlockRoot', async () => {
      const root0 = await commitmentContract.getBlockRoot(0)
      root0.should.equal(
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      )
    })
    it('allows the aggregator to submit a new block and stores it', async () => {
      const header =
        '0x1100000000000000000000000000000000000000000000000000000000000000'
      await commitmentContract.submitBlock(header)
      const storedHeader = await commitmentContract.getBlockRoot(0)
      storedHeader.should.equal(header)
    })
    it('allows the aggregator to submit two blocks and stores them', async () => {
      const header0 =
        '0x1100000000000000000000000000000000000000000000000000000000000000'
      const header1 =
        '0x2200000000000000000000000000000000000000000000000000000000000000'
      await commitmentContract.submitBlock(header0)
      await commitmentContract.submitBlock(header1)
      const storedHeader = await commitmentContract.getBlockRoot(1)
      storedHeader.should.equal(header1)
    })
    it.skip('throws if someone else tries to submit a block', async () => {
      const secondCommitmentContract = await deployContract(
        wallet,
        Commitment,
        ['0x94BA4d5Ebb0e05A50e977FFbF6e1a1Ee3D89299c']
      )
      chai
        .expect(
          secondCommitmentContract.submitBlock(
            '0x0000000000000000000000000000000000000000000000000000000000000000'
          )
        )
        .to.be.revertedWith('Only the aggregator can submit blocks.')
    })
  })
  describe('Full flow', () => {
    const numUpdatesPerSubtree = 5
    const numStateSubtrees = 3
    const block = generatePlasmaBlockOfSize(
      numUpdatesPerSubtree,
      numStateSubtrees
    )
    const updateToProveIndex = 0
    const subtreeToProveIndex = 0
    const updateToProve =
      block.subtrees[subtreeToProveIndex].dataBlocks[updateToProveIndex]
    const proof = block.getStateUpdateInclusionProof(
      updateToProveIndex,
      subtreeToProveIndex
    )
    it('should verify inclusion of an SU in a submitted  block', async () => {
      await commitmentContract.submitBlock(block.root().hash)
      const verification = await commitmentContract.verifyStateUpdateInclusion(
        updateToProve.jsonified,
        proof.jsonified
      )
      verification.should.be.true
    })
    it('should not verify if wrong block order', async () => {
      await commitmentContract.submitBlock(
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      )
      await commitmentContract.submitBlock(block.root().hash)
      const verification = await commitmentContract.verifyStateUpdateInclusion(
        updateToProve.jsonified,
        proof.jsonified
      )
      verification.should.be.false
    })
  })
})
