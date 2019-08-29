import { BigNumber } from '../number'

export interface MerkleTreeNode {
  hash: Buffer
  value: Buffer
}

export interface MerkleTreeInclusionProof {
  key: BigNumber
  value: Buffer
  siblings: Buffer[]
}

export interface SparseMerkleTree {
  /**
   * Verifies that the provided inclusion proof and stores the
   * associated siblings for future updates / calculations.
   *
   * @param inclusionProof The inclusion proof in question
   * @return true if the proof was valid (and thus stored), false otherwise
   */
  verifyAndStore(inclusionProof: MerkleTreeInclusionProof): Promise<boolean>

  /**
   * Updates the provided key in the Merkle Tree to have the value as data,
   * including all ancestors' hashes that result from this modification.
   *
   * @param key The key to update
   * @param value The new value
   * @return true if the update succeeded, false if we're missing the intermediate nodes / siblings required for this
   */
  update(key: BigNumber, value: Buffer): Promise<boolean>

  /**
   * Gets the root hash for this tree.
   *
   * @returns The root hash.
   */
  getRootHash(): Promise<Buffer>
}
