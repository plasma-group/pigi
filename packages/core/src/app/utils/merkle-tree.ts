import {
  BIG_ENDIAN,
  BigNumber,
  DB,
  HashFunction,
  MerkleTreeInclusionProof,
  MerkleTreeNode,
  SparseMerkleTree,
  TWO,
  ZERO,
} from '../../types'
import { keccak256 } from './crypto'

export class SparseMerkleTreeImpl implements SparseMerkleTree {
  private static readonly emptyBuffer: Buffer = new Buffer(32).fill(0)
  private static readonly siblingBuffer: Buffer = new Buffer(1).fill(0)
  private static readonly leafPointerByte: string = '\x01'

  private zeroHashes: Buffer[]
  private readonly hashBuffer: Buffer = new Buffer(64)

  constructor(
    private readonly db: DB,
    private root?: MerkleTreeNode,
    private readonly height: number = 160,
    private readonly hashFunction: HashFunction = keccak256
  ) {
    this.populateZeroHashesAndRoot()
  }

  public async verifyAndStore(
    inclusionProof: MerkleTreeInclusionProof
  ): Promise<boolean> {
    if (
      inclusionProof.siblings.length !== this.height - 1 ||
      !this.root.hash.equals(inclusionProof.siblings[0])
    ) {
      return false
    }

    const alreadyPresent = await this.db.get(
      this.hashFunction(inclusionProof.value)
    )
    if (!!alreadyPresent) {
      return true
    }

    let allZeroHashSiblings: boolean = true
    let node: MerkleTreeNode = this.createNode(
      this.hashFunction(inclusionProof.value),
      inclusionProof.value
    )
    let parent: MerkleTreeNode = node
    const nodesToStore: MerkleTreeNode[] = [node]
    for (let i = this.height - 1; i >= 0; i++) {
      allZeroHashSiblings =
        allZeroHashSiblings &&
        inclusionProof.siblings[i].equals(this.zeroHashes[i]) &&
        i !== 0
      node = parent
      parent = this.calculateParentNode(
        node,
        inclusionProof.siblings[i],
        inclusionProof.key,
        i
      )
      // Only store if at least one sibling has not been a zero hash or we're at the root
      if (!allZeroHashSiblings) {
        // If first non-zero, store shortcut
        if (nodesToStore.length === 1) {
          nodesToStore.push(
            this.createZeroHashesNode(
              node.hash,
              inclusionProof.value,
              inclusionProof.key,
              i
            )
          )
        } else {
          nodesToStore.push(node)
        }
        const siblingNode: MerkleTreeNode = await this.createProofSiblingNode(
          inclusionProof.siblings[i]
        )
        if (!!siblingNode) {
          nodesToStore.push(siblingNode)
        }
      }
    }
    if (!parent.hash.equals(this.root.hash)) {
      return false
    }

    await Promise.all(nodesToStore.map((n) => this.db.put(n.hash, n.value)))
    return true
  }

  public async update(key: BigNumber, value: Buffer): Promise<boolean> {
    let node: MerkleTreeNode = this.root
    const nodesToUpdate: MerkleTreeNode[] = []

    let depth
    // Traverse down, noting nodes to update so siblings can be found on the way back up
    for (depth = 0; depth < this.height; depth++) {
      nodesToUpdate.push(node)
      switch (node.value.length) {
        case 64:
          // This is a standard node
          node = this.isLeft(key, depth)
            ? await this.getNode(node.value.subarray(0, 32))
            : await this.getNode(node.value.subarray(32))
          break
        case 65:
          // This is a pointer to a leaf node hash (0x01 + key_as_buffer + node_hash)
          const leafKey: Buffer = node.value.subarray(1, 33)
          if (!SparseMerkleTreeImpl.keyToBuffer(key, depth).equals(leafKey)) {
            return false
          }
          // skip to the leaf
          node = await this.getNode(node.value.subarray(33))
          depth = this.height - 1
          break
        default:
          // This is malformed or a disconnected sibling node
          return false
      }
    }

    // Traverse back up the tree creating the updated hashes
    // Start with calculating all of the zero hashes
    const numberOfZeroHashes = this.height - nodesToUpdate.length
    let nodeHash: Buffer = this.hashFunction(value)
    for (let i = 0; i < numberOfZeroHashes; i++) {
      depth = this.height - i - 1
      nodeHash = this.calculateParentHash(
        nodeHash,
        this.zeroHashes[depth],
        key,
        depth
      )
    }

    // Now that we're at non-zero hashes, update all of the nodes we populated on the way down.
    let updatedChild: MerkleTreeNode = nodesToUpdate[nodesToUpdate.length - 1]
    const hashesToDelete: Buffer[] = [node.hash, updatedChild.hash]
    updatedChild.hash = nodeHash
    updatedChild.value = this.createZeroHashesNode(
      node.hash,
      value,
      key,
      --depth
    ).value
    for (let i = nodesToUpdate.length - 2; i >= 0; i--) {
      hashesToDelete.push(nodesToUpdate[i].hash)
      updatedChild = this.updateNode(
        nodesToUpdate[i],
        updatedChild,
        key,
        --depth
      )
    }

    const dbUpdatePromises: any[] = []
    dbUpdatePromises.push(
      ...nodesToUpdate.map((n) => this.db.put(n.hash, n.value))
    )
    dbUpdatePromises.push(...hashesToDelete.map((k) => this.db.del(k)))

    await Promise.all(dbUpdatePromises)

    this.root = nodesToUpdate[0]
    return true
  }

  /**
   * Updates the provided MerkleTreeNode based on the provided updated child node.
   *
   * @param node The node to update
   * @param updatedChild The child of the node to update that has changed
   * @param key The key for the updated leaf
   * @param depth the depth of the
   * @returns A reference to the provided node to update
   */
  private updateNode(
    node: MerkleTreeNode,
    updatedChild: MerkleTreeNode,
    key: BigNumber,
    depth: number
  ): MerkleTreeNode {
    const isLeft: boolean = this.isLeft(key, depth)
    if (isLeft) {
      node.value.fill(updatedChild.hash, 0, 32)
    } else {
      node.value.fill(updatedChild.hash, 32)
    }
    node.hash = this.hashFunction(node.value)
    return node
  }

  /**
   * Gets the portion of the provided key that describes the path at and below
   * the provided depth as a buffer.
   *
   * @param key The key
   * @param depth The depth
   * @returns The resulting buffer of the key
   */
  private static keyToBuffer(key: BigNumber, depth: number): Buffer {
    return key.shiftLeft(depth).toBuffer(BIG_ENDIAN, 32)
  }

  /**
   * Creates a shortcut node that has a hash that results from a single leaf-node
   * iteratively hashed up the tree with the zero hashes values up to the provided depth,
   * and a value that contains the leaf hash for quick look-up.
   *
   * @param nodeHash The hash identifying the node to store.
   * @param leafValue The leaf value that this is a shortcut to
   * @param leafKey The key associated with the leaf
   * @param depth The depth of the node to create
   * @returns The MerkleTreeNode
   */
  private createZeroHashesNode(
    nodeHash: Buffer,
    leafValue: Buffer,
    leafKey: BigNumber,
    depth: number
  ): MerkleTreeNode {
    const value: Buffer = new Buffer(65)
      .fill(SparseMerkleTreeImpl.leafPointerByte, 0, 1)
      .fill(SparseMerkleTreeImpl.keyToBuffer(leafKey, depth), 1, 33)
      .fill(this.hashFunction(leafValue), 33)
    return this.createNode(nodeHash, value)
  }

  /**
   * Creates a Merkle Proof sibling node if a node with this hash has not already been stored
   * in the DB.
   *
   * @param nodeHash The hash of the node to create if not already present.
   * @returns The created node if one was created or undefined if one already exists.
   */
  private async createProofSiblingNode(
    nodeHash: Buffer
  ): Promise<MerkleTreeNode> {
    const node: MerkleTreeNode = await this.getNode(nodeHash)
    if (!!node) {
      return undefined
    }
    return this.createNode(nodeHash, SparseMerkleTreeImpl.siblingBuffer)
  }

  /**
   * Gets the MerkleTreeNode with the provided hash from the DB, if one exists.
   *
   * @param nodeHash The node hash uniquely identifying the node
   * @returns The node, if one was found
   */
  private async getNode(nodeHash: Buffer): Promise<MerkleTreeNode> {
    const value: Buffer = await this.db.get(nodeHash)
    if (!value) {
      return undefined
    }
    return this.createNode(nodeHash, value)
  }

  /**
   * Calculates the parent hash from the provided node and sibling, using the key and depth
   * to determine whether the node is the left node or the sibling is the left node.
   *
   * @param nodeHash The node hash used as 1/2 input to parent calculation
   * @param siblingHash The sibling node hash used as 1/2 input to parent calculation
   * @param key The key representing the path to this node
   * @param depth The depth of this node
   * @returns The parent hash
   */
  private calculateParentHash(
    nodeHash: Buffer,
    siblingHash: Buffer,
    key: BigNumber,
    depth: number
  ): Buffer {
    return this.isLeft(key, depth)
      ? this.hashFunction(this.hashBuffer.fill(nodeHash).fill(siblingHash, 32))
      : this.hashFunction(this.hashBuffer.fill(siblingHash).fill(nodeHash, 32))
  }

  /**
   * Calculates the parent hash from the provided node and sibling hash, using the key and depth
   * to determine whether the node is the left node or the sibling is the left node.
   *
   * @param node The node whose hash is used as 1/2 input to parent calculation
   * @param siblingHash The sibling node hash used as 1/2 input to parent calculation
   * @param key The key representing the path to this node
   * @param depth The depth of this node
   * @returns The parent node
   */
  private calculateParentNode(
    node: MerkleTreeNode,
    sibling: Buffer,
    key: BigNumber,
    depth: number
  ): MerkleTreeNode {
    const value = new Buffer(64)
    if (this.isLeft(key, depth)) {
      this.hashBuffer
        .fill(node.hash)
        .fill(sibling, 32)
        .copy(value)
    } else {
      this.hashBuffer
        .fill(sibling)
        .fill(node.hash, 32)
        .copy(value)
    }

    return this.createNode(this.hashFunction(this.hashBuffer), value)
  }

  /**
   * Populates the zero-hash array for each level of the Sparse Merkle Tree
   * and stores the resulting root.
   */
  private populateZeroHashesAndRoot(): void {
    const emptyBuffer: Buffer = new Buffer(32).fill('\x00')
    const hashes: Buffer[] = [this.hashFunction(emptyBuffer)]

    for (let i = 1; i < this.height; i++) {
      hashes[i] = this.hashFunction(
        this.hashBuffer.fill(hashes[i - 1], 0, 32).fill(hashes[i - 1], 32)
      )
    }

    this.zeroHashes = hashes.reverse()

    if (!this.root) {
      this.root = this.createNode(this.zeroHashes[0], undefined)
    }
  }

  /**
   * Helper function to create a MerkleTreeNode from the provided hash and value
   *
   * @param hash The hash
   * @param value The value
   * @returns The resulting MerkleTreeNode
   */
  private createNode(hash: Buffer, value: Buffer): MerkleTreeNode {
    return { hash, value }
  }

  /**
   * Determines whether or not the key at the provided depth points to the left child or right child.
   *
   * @param key The key
   * @param depth The depth
   * @returns true if the key points to the left child at the provided depth, false if right
   */
  private isLeft(key: BigNumber, depth: number): boolean {
    return key
      .shiftLeft(depth)
      .shiftRight(this.height - 1)
      .mod(TWO)
      .equals(ZERO)
  }
}
