import {
  BigNumber,
  DB,
  HashFunction,
  MerkleTreeInclusionProof,
  MerkleTreeNode,
  ONE,
  SparseMerkleTree,
  ZERO,
} from '../../types'
import { keccak256 } from './crypto'

export class SparseMerkleTreeImpl implements SparseMerkleTree {
  private zeroHashes: Buffer[]
  private readonly hashBuffer: Buffer = new Buffer(64)

  constructor(
    private readonly db: DB,
    private root?: Buffer,
    private readonly height: number = 160,
    private readonly hashFunction: HashFunction = keccak256
  ) {
    this.populateZeroHashesAndRoot()
  }

  public async update(key: BigNumber, value: Buffer): Promise<boolean> {
    const nodes: MerkleTreeNode[] = []

    let useZeros: boolean = false
    let index: BigNumber = key.clone()
    let hash: Buffer = this.hashFunction(value)
    let level: number = this.height
    for (; level > 0; level--) {
      const isLeft: boolean = index.modNum(2).equals(ZERO)
      nodes.push(this.createNode(index, level, hash))

      let sibling: Buffer
      if (useZeros) {
        sibling = this.zeroHashes[level - 1]
      } else {
        sibling = await this.db.get(
          this.getStorageKey(isLeft ? index.add(ONE) : index.sub(ONE), level)
        )
        if (!sibling) {
          return false
        }
        if (sibling.equals(this.zeroHashes[level - 1])) {
          useZeros = true
        }
      }
      hash = this.getParentHash(hash, sibling, isLeft)
      index = index.shiftRight(1)
    }

    this.root = hash
    await this.db.put(this.getStorageKey(ZERO, 0), hash)

    return true
  }

  public async verifyAndStore(
    inclusionProof: MerkleTreeInclusionProof
  ): Promise<boolean> {
    if (inclusionProof.siblings.length !== this.height) {
      return false
    }
    const nodes: MerkleTreeNode[] = []

    let index: BigNumber = inclusionProof.key.clone()
    let hash: Buffer = this.hashFunction(inclusionProof.value)
    let level: number = this.height
    for (const sibling of inclusionProof.siblings) {
      const isLeft: boolean = index.modNum(2).equals(ZERO)
      nodes.push(this.createNode(index, level, hash))
      hash = this.getParentHash(hash, sibling, isLeft)
      nodes.push(
        this.createNode(
          isLeft ? index.add(ONE) : index.sub(ONE),
          level,
          sibling
        )
      )

      index = index.shiftRight(1)
      level--
    }

    if (!this.root.equals(hash)) {
      return false
    }

    await Promise.all(
      nodes.map((n) => this.db.put(this.getStorageKey(n.key, level), n.value))
    )

    return true
  }

  private populateZeroHashesAndRoot(): void {
    const emptyBuffer: Buffer = new Buffer(32).fill('\x00')
    const hashes: Buffer[] = [this.hashFunction(emptyBuffer)]

    for (let i = 1; i < this.height; i++) {
      hashes[i] = this.hashFunction(
        this.hashBuffer.fill(hashes[i - 1], 0, 32).fill(hashes[i - 1], 32)
      )
    }
    if (!this.root) {
      this.root = this.hashFunction(
        this.hashBuffer
          .fill(hashes[this.height - 1], 0, 32)
          .fill(hashes[this.height - 1], 32)
      )
    }

    this.zeroHashes = hashes.reverse()
  }

  private getParentHash(
    left: Buffer,
    right: Buffer,
    inOrder: boolean = true
  ): Buffer {
    return inOrder
      ? this.hashFunction(this.hashBuffer.fill(left, 0, 32).fill(right, 32))
      : this.hashFunction(this.hashBuffer.fill(right, 0, 32).fill(left, 32))
  }

  private createNode(
    key: BigNumber,
    level: number,
    value: Buffer
  ): MerkleTreeNode {
    return { key, level, value }
  }

  private getStorageKey(key: BigNumber, level: number = this.height): Buffer {
    return Buffer.from(`${key.toString()}-${level}`)
  }
}
