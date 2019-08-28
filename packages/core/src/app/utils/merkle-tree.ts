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

/**
 * SparseMerkleTree implementation built using the optimizations implemented by Vitalik
 * here: https://github.com/ethereum/research/blob/master/sparse_merkle_tree/new_bintrie_optimized.py
 *
 * Namely, no intermediate nodes are persisted between a single leaf value and
 * its first ancestor node with a non-zero-hash sibling. In order to not store these intermediate
 * nodes, this ancestor node is stored with its identifier being its correct hash, but its value
 * contains its only non-zero-hash leaf node descendent's hash as well as the key that
 * represents the path to it starting from this ancestor node.
 */
export class OptimizedSparseMerkleTree implements SparseMerkleTree {
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
    if (inclusionProof.siblings.length !== this.height - 1) {
      return false
    }

    const leafHash: Buffer = this.hashFunction(inclusionProof.value)
    if (!!(await this.db.get(leafHash))) {
      return true
    }

    let allEmptySiblings: boolean = true
    let node: MerkleTreeNode = this.createNode(leafHash, inclusionProof.value)
    let parent: MerkleTreeNode = node
    const nodesToStore: MerkleTreeNode[] = [node]
    for (let depth = this.height - 1; depth >= 0; depth--) {
      allEmptySiblings =
        allEmptySiblings &&
        inclusionProof.siblings[depth].equals(this.zeroHashes[depth]) &&
        depth !== 0

      node = parent
      parent = this.calculateParentNode(
        node,
        inclusionProof.siblings[depth],
        inclusionProof.key,
        depth
      )

      // Don't store nodes that can be re-calculated from key, leaf, and zeroHashes
      if (!allEmptySiblings) {
        // If this is the first non-zero-hash ancestor of leaf node, store shortcut to leaf node
        if (nodesToStore.length === 1) {
          node = this.createLeafShortcutNode(
            node.hash,
            inclusionProof.value,
            inclusionProof.key,
            depth
          )
        }
        nodesToStore.push(node)
        const siblingNode: MerkleTreeNode = await this.createProofSiblingNode(
          inclusionProof.siblings[depth]
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
    // let node: MerkleTreeNode = this.root
    const nodesToUpdate: MerkleTreeNode[] = await this.getNodesInPath(key)
    if (!nodesToUpdate) {
      return false
    }

    const oldLeaf: MerkleTreeNode = nodesToUpdate[nodesToUpdate.length - 1]
    oldLeaf.hash = this.hashFunction(value)
    oldLeaf.value = value

    const ancestorHash: Buffer = this.getZeroHashAncestorFromLeaf(
      key,
      value,
      this.height - nodesToUpdate.length
    )

    let depth: number = nodesToUpdate.length - 2 // -2 because this array also contains the leaf
    let updatedChild: MerkleTreeNode = nodesToUpdate[depth]
    const hashesToDelete: Buffer[] = [oldLeaf.hash, updatedChild.hash]
    // Update the node pointing to the leaf
    updatedChild.hash = ancestorHash
    updatedChild.value = this.createLeafShortcutNode(
      ancestorHash,
      value,
      key,
      depth
    ).value

    // Iteratively update all nodes from the leaf-pointer node up to the root
    for (let i = nodesToUpdate.length - 2; i >= 0; i--) {
      hashesToDelete.push(nodesToUpdate[i].hash)
      updatedChild = this.updateNode(
        nodesToUpdate[i],
        updatedChild,
        key,
        depth--
      )
    }

    await Promise.all([
      ...nodesToUpdate.map((n) => this.db.put(n.hash, n.value)),
      ...hashesToDelete.map((k) => this.db.del(k)),
    ])

    this.root = nodesToUpdate[0]
    return true
  }

  /**
   * Gets the hash of the ancestor from the provided leaf value up numberOfZeroHashes levels.
   * all node hashes will be calculated as hash(last_calculated_hash + zero_hashes[depth]) or
   * hash(zero_hashes[depth] + last_calculated_hash) depending on the bit in the key
   * associated with the depth in question.
   *
   * @param key The full path to the leaf node
   * @param leafValue The leaf node value
   * @param numberOfZeroHashes The number of times to iterate
   * @returns the resulting ancestor hash
   */
  private getZeroHashAncestorFromLeaf(
    key: BigNumber,
    leafValue: Buffer,
    numberOfZeroHashes: number
  ): Buffer {
    let nodeHash: Buffer = this.hashFunction(leafValue)
    for (let i = 1; i <= numberOfZeroHashes; i++) {
      const depth = this.height - i
      nodeHash = this.calculateParentHash(
        nodeHash,
        this.zeroHashes[depth],
        key,
        depth
      )
    }
    return nodeHash
  }

  /**
   * Gets an array of MerkleTreeNodes starting at the root and iterating down to the leaf
   * following the path in the provided key. The returned array will omit any nodes that
   * are not persisted because they can be calculated from the leaf and the zeroHashes.
   *
   * @param key The key describing the path to the leaf in question
   * @returns The array of MerkleTreeNodes from root to leaf
   */
  private async getNodesInPath(key: BigNumber): Promise<MerkleTreeNode[]> {
    let node: MerkleTreeNode = this.root
    const nodesToUpdate: MerkleTreeNode[] = []

    let depth
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
          if (
            !OptimizedSparseMerkleTree.keyToBuffer(key, depth).equals(leafKey)
          ) {
            return undefined
          }
          // skip to the leaf
          node = await this.getNode(node.value.subarray(33))
          depth = this.height
          break
        default:
          // This is malformed or a disconnected sibling node
          return undefined
      }
    }
    nodesToUpdate.push(node)
    return nodesToUpdate
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
  private createLeafShortcutNode(
    nodeHash: Buffer,
    leafValue: Buffer,
    leafKey: BigNumber,
    depth: number
  ): MerkleTreeNode {
    const value: Buffer = new Buffer(65)
      .fill(OptimizedSparseMerkleTree.leafPointerByte, 0, 1)
      .fill(OptimizedSparseMerkleTree.keyToBuffer(leafKey, depth), 1, 33)
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
    return this.createNode(nodeHash, OptimizedSparseMerkleTree.siblingBuffer)
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
