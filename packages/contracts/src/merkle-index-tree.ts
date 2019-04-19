/* External Imports */
const Web3 = require('web3') // tslint:disable-line
import debug from 'debug'
const log = debug('info:merkle-index-tree')
import { StateUpdate, STATE_ID_LENGTH }  from '@pigi/utils'

/* Internal Imports */

function sha3(value) {
  // Requires '0x' + becuase web3 only interprets strings as bytes if they start with 0x
  const hashString = '0x' + value.toString('hex')
  const solidityHash = Web3.utils.soliditySha3(hashString)
  return Buffer.from(solidityHash.slice(2), 'hex') // Slice 2 to remove the dumb 0x
}

export class MerkleIndexTreeNode {
  public data: Buffer

  constructor (readonly hash: Buffer, readonly index: Buffer) {
    this.data = Buffer.concat([this.hash, this.index])
  }
}

export class MerkleIndexTree {
  public levels: MerkleIndexTreeNode[][]

  constructor (readonly leaves: any[]) {
    const bottom = this.parseLeaves(leaves)
    this.levels = [bottom]
    this.generate(bottom)
  }

  public static parent (left: MerkleIndexTreeNode, right: MerkleIndexTreeNode): MerkleIndexTreeNode {
    if (Buffer.compare(left.index, right.index) >= 0) {
      throw new Error('Left index (0x' + left.index.toString('hex') + ') not less than right index (0x' + right.index.toString('hex') + ')')
    }
    const concatenated = Buffer.concat([left.data, right.data])
    return new MerkleIndexTreeNode(sha3(concatenated), left.index)
  }

  public static emptyLeaf (length: number): MerkleIndexTreeNode {
    const hash = Buffer.from(new Array(32).fill(0))
    const filledArray = new Array(length).fill(255)
    const index = Buffer.from(filledArray)
    return new MerkleIndexTreeNode(hash, index)
  }

  public parseLeaves(leaves: any): MerkleIndexTreeNode[] {
    return leaves
  }

  public root(): MerkleIndexTreeNode {
    return this.levels[this.levels.length - 1][0]
  }

  private generate(children: MerkleIndexTreeNode[]) {
    log('in generate with children', children)
    if(children.length === 1) {
      return
    }
    const parents = []
    for (let i = 0; i < children.length; i += 2) {
      const left = children[i]
      const right = 
        i + 1 === children.length ? MerkleIndexTree.emptyLeaf(left.index.length) : children[i + 1]
      const parent = MerkleIndexTree.parent(left, right)
      parents.push(parent)
    }

    this.levels.push(parents)
    this.generate(parents)
  }
}

export class MerkleStateIndexTree extends MerkleIndexTree {
  public parseLeaves(leaves: StateUpdate[]): MerkleIndexTreeNode[] {
    const bottom = leaves.map((stateUpdate) => {
      const hash = sha3(stateUpdate.encoded)
      const index = stateUpdate.start.toBuffer('be', STATE_ID_LENGTH)
      return new MerkleIndexTreeNode(hash, index)
    })
    return bottom
  }
}

export interface SubtreeContents {
  address: Buffer
  stateUpdates: StateUpdate[]
}

export class PlasmaBlock extends MerkleIndexTree {
  public subtrees: MerkleStateIndexTree[]

  public parseLeaves(blockContents: SubtreeContents[]): MerkleIndexTreeNode[] {
    const sortedBlockContents = blockContents.sort((subTreeContents1, subTreeContents2) => Buffer.compare(subTreeContents1.address, subTreeContents2.address))
    this.subtrees = []
    const bottom = []
    for (const subtreeContents of sortedBlockContents) {
      const merkleStateIndexTree = new MerkleStateIndexTree(subtreeContents.stateUpdates)
      this.subtrees.push(merkleStateIndexTree)
      bottom.push(new MerkleIndexTreeNode(merkleStateIndexTree.root().hash, subtreeContents.address))
    }
    return bottom
  }
}
