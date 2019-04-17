import '../setup'

/* External Imports */
import { Contract } from 'web3-eth-contract'
import debug from 'debug'
const log = debug('test:info:merkle-index-tree')

/* Internal Imports */
import { MerkleIndexTree, MerkleIndexTreeNode  } from '../../src/merkle-index-tree'
import { AssertionError } from 'assert';

describe.only('merkle-index-tree', () => {
  describe('MerkleIndexTreeNode', () => {
    it('should concatenate index and hash after construction', async() => {
      const node = new MerkleIndexTreeNode(Buffer.from([255]), Buffer.from([0])) 
      log('New merkle index tree node:', node)
      const expected = Buffer.concat([Buffer.from([255]), Buffer.from([0])])
      node.data.should.deep.equal(expected)
    })
  })
  describe('MerkleIndexTree', () => {
    describe('parent', () => {
      it('should return the correct parent', async() => {
        const left = new MerkleIndexTreeNode(Buffer.from([13]), Buffer.from([10])) 
        const right = new MerkleIndexTreeNode(Buffer.from([31]), Buffer.from([15])) 
        const parent = MerkleIndexTree.parent(left, right)
        // We calculated the hash by hand.
        parent.data.toString('hex').should.equal('69b053cd194c51ff15ac9db85fc581c4457a7160c78d878e7c5b84f4c1fbb9140a')
      })
      it('should throw if left & right nodes are out of order', async() => {
        const left = new MerkleIndexTreeNode(Buffer.from([13]), Buffer.from([15])) 
        const right = new MerkleIndexTreeNode(Buffer.from([31]), Buffer.from([10])) 
        const parentCall = () => MerkleIndexTree.parent(left, right)
        parentCall.should.throw()
      })
    })
    it('should generate a generic tree', async() => {
      const leaves = []
      for (let i = 0; i < 4; i++) {
        leaves.push(new MerkleIndexTreeNode(Buffer.from([Math.floor(Math.random()*100)]), Buffer.from([i])))
      }
      const indexTree = new MerkleIndexTree(leaves)
      log(indexTree.levels)
      log(indexTree.root)
    })
  })
})
