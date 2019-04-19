/* External Imports */
const Web3 = require('web3') // tslint:disable-line
import debug from 'debug'
const log = debug('info:merkle-index-tree')
import { StateUpdate }  from '@pigi/utils'

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
    const bottom = MerkleIndexTree.parseLeaves(leaves)
    this.levels = [bottom]
    this.generate(bottom)
  }

  public static parent (left: MerkleIndexTreeNode, right: MerkleIndexTreeNode): MerkleIndexTreeNode {
    if (Buffer.compare(left.index, right.index) > 0) {
      throw new Error('Left index (0x' + left.index.toString('hex') + ') greater than right index (0x' + right.index.toString('hex') + ')')
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

  public static parseLeaves(leaves: any): MerkleIndexTreeNode[] {
    return leaves
  }

  public root(): MerkleIndexTreeNode {
    return this.levels[this.levels.length - 1][0]
  }

  private generate(children: MerkleIndexTreeNode[]) {
    log('in generate with children', children)
    if(children.length === 1) {
      this.levels.push(children)
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
  public static parseLeaves(leaves: StateUpdate[]): MerkleIndexTreeNode[] {
    log(leaves)
    return [new MerkleIndexTreeNode(Buffer.from([13]), Buffer.from([15]))]
  }
}
