import '../../setup'

import MemDown from 'memdown'
import * as assert from 'assert'

import { BaseDB } from '../../../src/app/db'
import {
  BigNumber,
  keccak256,
  ONE,
  OptimizedSparseMerkleTree,
  THREE,
  TWO,
  ZERO,
} from '../../../src/app/utils'
import { TestUtils } from './test-utils'
import {
  HashFunction,
  MerkleTree,
  MerkleTreeInclusionProof,
  SparseMerkleTree,
} from '../../../src/types/utils'
import { DB } from '../../../src/types'

const hashBuffer: Buffer = new Buffer(64)
const hashFunction: HashFunction = keccak256
const zeroHash: Buffer = hashFunction(OptimizedSparseMerkleTree.emptyBuffer)

const verifyEmptyTreeWithDepth = async (
  tree: SparseMerkleTree,
  key: BigNumber,
  depth: number
): Promise<void> => {
  let zeroHashParent: Buffer = zeroHash
  const siblings: Buffer[] = []
  for (let i = depth - 2; i >= 0; i--) {
    siblings.push(zeroHashParent)
    zeroHashParent = hashFunction(
      hashBuffer.fill(zeroHashParent, 0, 32).fill(zeroHashParent, 32)
    )
  }

  const inclusionProof: MerkleTreeInclusionProof = {
    rootHash: await tree.getRootHash(),
    key,
    value: OptimizedSparseMerkleTree.emptyBuffer,
    siblings: siblings.reverse(),
  }

  assert(
    await tree.verifyAndStore(inclusionProof),
    'Unable to verify inclusion proof on empty tree when it should be valid.'
  )
}

const createAndVerifyEmptyTreeDepthWithDepth = async (
  db: DB,
  key: BigNumber,
  depth: number
): Promise<SparseMerkleTree> => {
  const tree: SparseMerkleTree = new OptimizedSparseMerkleTree(
    db,
    undefined,
    depth,
    hashFunction
  )

  await verifyEmptyTreeWithDepth(tree, key, depth)
  return tree
}

const getRootHashOnlyHashingWithEmptySiblings = (
  leafValue: Buffer,
  key: BigNumber,
  treeHeight: number
): Buffer => {
  let zeroHashParent: Buffer = zeroHash
  let hash: Buffer = hashFunction(leafValue)

  for (let depth = treeHeight - 2; depth >= 0; depth--) {
    const left: boolean = key
      .shiftLeft(depth)
      .shiftRight(treeHeight - 2)
      .mod(TWO)
      .equals(ZERO)
    hash = left
      ? hashFunction(hashBuffer.fill(hash, 0, 32).fill(zeroHashParent, 32))
      : hashFunction(hashBuffer.fill(zeroHashParent, 0, 32).fill(hash, 32))

    zeroHashParent = hashFunction(
      hashBuffer.fill(zeroHashParent, 0, 32).fill(zeroHashParent, 32)
    )
  }

  return hash
}

describe('OptimizedSparseMerkleTree', () => {
  let db: BaseDB
  let memdown: any
  beforeEach(() => {
    memdown = new MemDown('') as any
    db = new BaseDB(memdown, 256)
  })

  afterEach(async () => {
    await Promise.all([db.close()])
    memdown = undefined
  })

  describe('Constructor', () => {
    it('should construct without error', async () => {
      new OptimizedSparseMerkleTree(db)
    })

    it('accepts a non-empty root hash', async () => {
      new OptimizedSparseMerkleTree(db, new Buffer(32).fill('root', 0))
    })

    it('throws if root is not 32 bytes', async () => {
      TestUtils.assertThrows(() => {
        new OptimizedSparseMerkleTree(db, new Buffer(31).fill('root', 0))
      }, assert.AssertionError)
    })

    it('throws if height is < 0', async () => {
      TestUtils.assertThrows(() => {
        new OptimizedSparseMerkleTree(db, undefined, -1)
      }, assert.AssertionError)
    })
  })

  describe('verifyAndStore', () => {
    it('verifies empty root', async () => {
      await createAndVerifyEmptyTreeDepthWithDepth(db, ZERO, 2)
    })

    it('verifies 3-level empty root', async () => {
      await createAndVerifyEmptyTreeDepthWithDepth(db, ZERO, 3)
    })
    it('verifies 4-level empty root', async () => {
      await createAndVerifyEmptyTreeDepthWithDepth(db, ZERO, 4)
    })

    it('verifies empty root with key of 1', async () => {
      await createAndVerifyEmptyTreeDepthWithDepth(db, ONE, 2)
    })

    it('verifies 3-level empty root with key of 1', async () => {
      await createAndVerifyEmptyTreeDepthWithDepth(db, ONE, 3)
    })
    it('verifies 4-level empty root with key of 1', async () => {
      await createAndVerifyEmptyTreeDepthWithDepth(db, ONE, 4)
    })

    it('fails on invalid proof for empty root', async () => {
      const tree: SparseMerkleTree = new OptimizedSparseMerkleTree(
        db,
        undefined,
        2,
        hashFunction
      )

      const inclusionProof: MerkleTreeInclusionProof = {
        rootHash: await tree.getRootHash(),
        key: ZERO,
        value: Buffer.from('this will fail.'),
        siblings: [hashFunction(OptimizedSparseMerkleTree.emptyBuffer)],
      }

      assert(
        !(await tree.verifyAndStore(inclusionProof)),
        'Should have failed on invalid proof for empty root but did not'
      )
    })

    it('verifies non-empty root', async () => {
      const value: Buffer = new Buffer('non-empty')
      const root: Buffer = hashFunction(
        hashBuffer
          .fill(hashFunction(value), 0, 32)
          .fill(hashFunction(OptimizedSparseMerkleTree.emptyBuffer), 32)
      )

      const tree: SparseMerkleTree = new OptimizedSparseMerkleTree(
        db,
        root,
        2,
        hashFunction
      )

      const inclusionProof: MerkleTreeInclusionProof = {
        rootHash: await tree.getRootHash(),
        key: ZERO,
        value,
        siblings: [hashFunction(OptimizedSparseMerkleTree.emptyBuffer)],
      }

      assert(
        await tree.verifyAndStore(inclusionProof),
        'Should have verified non-empty root but did not.'
      )
    })

    it('verifies non-empty root with key of 1', async () => {
      const value: Buffer = new Buffer('non-empty')
      const root: Buffer = hashFunction(
        hashBuffer
          .fill(hashFunction(OptimizedSparseMerkleTree.emptyBuffer), 0, 32)
          .fill(hashFunction(value), 32)
      )

      const tree: SparseMerkleTree = new OptimizedSparseMerkleTree(
        db,
        root,
        2,
        hashFunction
      )

      const inclusionProof: MerkleTreeInclusionProof = {
        rootHash: await tree.getRootHash(),
        key: ONE,
        value,
        siblings: [hashFunction(OptimizedSparseMerkleTree.emptyBuffer)],
      }

      assert(
        await tree.verifyAndStore(inclusionProof),
        'Should have verified non-empty root but did not.'
      )
    })

    it('fails verifying invalid non-empty root', async () => {
      const value: Buffer = new Buffer('non-empty')
      const root: Buffer = hashFunction(
        hashBuffer
          .fill(hashFunction(value), 0, 32)
          .fill(hashFunction(OptimizedSparseMerkleTree.emptyBuffer), 32)
      )

      const tree: SparseMerkleTree = new OptimizedSparseMerkleTree(
        db,
        root,
        2,
        hashFunction
      )

      const inclusionProof: MerkleTreeInclusionProof = {
        rootHash: await tree.getRootHash(),
        key: ZERO,
        value: Buffer.from('not the right value'),
        siblings: [hashFunction(OptimizedSparseMerkleTree.emptyBuffer)],
      }

      assert(
        !(await tree.verifyAndStore(inclusionProof)),
        'Did not fail when verifying an invalid non-zero root.'
      )
    })
  })

  describe('update', () => {
    it('updates empty tree', async () => {
      const tree: SparseMerkleTree = await createAndVerifyEmptyTreeDepthWithDepth(
        db,
        ZERO,
        3
      )

      const value: Buffer = Buffer.from('much better value')
      assert(await tree.update(ZERO, value))

      const root: Buffer = getRootHashOnlyHashingWithEmptySiblings(
        value,
        ZERO,
        3
      )
      assert(
        root.equals(await tree.getRootHash()),
        'Root hashes do not match after update'
      )
    })

    it('updates empty tree at key 1', async () => {
      const tree: SparseMerkleTree = await createAndVerifyEmptyTreeDepthWithDepth(
        db,
        ONE,
        3
      )

      const value: Buffer = Buffer.from('much better value')
      assert(await tree.update(ONE, value))

      const root: Buffer = getRootHashOnlyHashingWithEmptySiblings(
        value,
        ONE,
        3
      )
      assert(
        root.equals(await tree.getRootHash()),
        'Root hashes do not match after update'
      )
    })

    it('updates empty tree at key 2', async () => {
      const tree: SparseMerkleTree = await createAndVerifyEmptyTreeDepthWithDepth(
        db,
        TWO,
        3
      )

      const value: Buffer = Buffer.from('much better value')
      assert(await tree.update(TWO, value))

      const root: Buffer = getRootHashOnlyHashingWithEmptySiblings(
        value,
        TWO,
        3
      )
      assert(
        root.equals(await tree.getRootHash()),
        'Root hashes do not match after update'
      )
    })

    it('updates empty tree at key 3', async () => {
      const tree: SparseMerkleTree = await createAndVerifyEmptyTreeDepthWithDepth(
        db,
        THREE,
        3
      )

      const value: Buffer = Buffer.from('much better value')
      assert(await tree.update(THREE, value))

      const root: Buffer = getRootHashOnlyHashingWithEmptySiblings(
        value,
        THREE,
        3
      )
      assert(
        root.equals(await tree.getRootHash()),
        'Root hashes do not match after update'
      )
    })

    it('updates empty tree at key 0 and 1', async () => {
      /*
              zh                    C                  F
             /  \                 /  \              /    \
           zh    zh     ->      B    zh     ->     E      zh
          /  \  /  \           /  \  /  \        /  \    /  \
        zh  zh  zh  zh        A  zh  zh  zh     A    D  zh  zh
      */

      const tree: SparseMerkleTree = await createAndVerifyEmptyTreeDepthWithDepth(
        db,
        ZERO,
        3
      )

      const value: Buffer = Buffer.from('much better value')
      const valueHash: Buffer = hashFunction(value)
      assert(await tree.update(ZERO, value))

      const root: Buffer = getRootHashOnlyHashingWithEmptySiblings(
        value,
        ZERO,
        3
      )
      assert(
        root.equals(await tree.getRootHash()),
        'Root hashes do not match after update'
      )

      // VERIFY AND UPDATE ONE

      // first sibling is other value, next is zero hash because parent's sibling tree is empty
      const siblings: Buffer[] = [valueHash]
      const zeroHashParent: Buffer = hashFunction(
        hashBuffer.fill(zeroHash, 0, 32).fill(zeroHash, 32)
      )
      siblings.push(zeroHashParent)

      const inclusionProof: MerkleTreeInclusionProof = {
        rootHash: await tree.getRootHash(),
        key: ONE,
        value: OptimizedSparseMerkleTree.emptyBuffer,
        siblings: siblings.reverse(),
      }

      assert(await tree.verifyAndStore(inclusionProof))

      const secondValue: Buffer = Buffer.from('much better value 2')
      const secondValueHash: Buffer = hashFunction(secondValue)

      assert(await tree.update(ONE, secondValue))

      let parentHash: Buffer = hashFunction(
        hashBuffer.fill(valueHash, 0, 32).fill(secondValueHash, 32)
      )
      parentHash = hashFunction(
        hashBuffer.fill(parentHash, 0, 32).fill(zeroHashParent, 32)
      )

      assert(
        parentHash.equals(await tree.getRootHash()),
        'Root hashes do not match after update'
      )
    })

    it('updates empty tree at key 0 and 2', async () => {
      /*
              zh                    C                  F
             /  \                 /  \              /    \
           zh    zh     ->      B    zh     ->     B      E
          /  \  /  \           /  \  /  \        /  \    /  \
        zh  zh  zh  zh        A  zh  zh  zh     A    zh  D  zh
      */

      const tree: SparseMerkleTree = await createAndVerifyEmptyTreeDepthWithDepth(
        db,
        ZERO,
        3
      )

      const value: Buffer = Buffer.from('much better value')
      const valueHash: Buffer = hashFunction(value)
      assert(await tree.update(ZERO, value))

      const root: Buffer = getRootHashOnlyHashingWithEmptySiblings(
        value,
        ZERO,
        3
      )
      assert(
        root.equals(await tree.getRootHash()),
        'Root hashes do not match after update'
      )

      // VERIFY AND UPDATE TWO

      const leftSubtreeSibling: Buffer = hashFunction(
        hashBuffer.fill(valueHash, 0, 32).fill(zeroHash, 32)
      )
      const siblings: Buffer[] = [zeroHash, leftSubtreeSibling]

      const inclusionProof: MerkleTreeInclusionProof = {
        rootHash: await tree.getRootHash(),
        key: TWO,
        value: OptimizedSparseMerkleTree.emptyBuffer,
        siblings: siblings.reverse(),
      }

      assert(await tree.verifyAndStore(inclusionProof))

      const secondValue: Buffer = Buffer.from('much better value 2')
      const secondValueHash: Buffer = hashFunction(secondValue)

      assert(await tree.update(TWO, secondValue))

      let parentHash: Buffer = hashFunction(
        hashBuffer.fill(secondValueHash, 0, 32).fill(zeroHash, 32)
      )
      parentHash = hashFunction(
        hashBuffer.fill(leftSubtreeSibling, 0, 32).fill(parentHash, 32)
      )

      assert(
        parentHash.equals(await tree.getRootHash()),
        'Root hashes do not match after update'
      )
    })
  })

  describe('getMerkleProof', () => {
    it('gets empty merkle proof', async () => {
      const tree: MerkleTree = await createAndVerifyEmptyTreeDepthWithDepth(
        db,
        ZERO,
        3
      )
      const proof: MerkleTreeInclusionProof = await tree.getMerkleProof(
        ZERO,
        OptimizedSparseMerkleTree.emptyBuffer
      )

      assert(proof.value.equals(OptimizedSparseMerkleTree.emptyBuffer))
      assert(proof.key.equals(ZERO))
      assert(proof.siblings.length === 2)

      let hash: Buffer = zeroHash
      assert(proof.siblings[1].equals(hash))
      hash = hashFunction(hashBuffer.fill(hash, 0, 32).fill(hash, 32))
      assert(proof.siblings[0].equals(hash))

      assert(proof.rootHash.equals(await tree.getRootHash()))
    })

    it('gets merkle proof for non-empty tree', async () => {
      const tree: MerkleTree = await createAndVerifyEmptyTreeDepthWithDepth(
        db,
        ZERO,
        3
      )
      const data: Buffer = Buffer.from('really great leaf data')
      await tree.update(ZERO, data)

      const proof: MerkleTreeInclusionProof = await tree.getMerkleProof(
        ZERO,
        OptimizedSparseMerkleTree.emptyBuffer
      )

      assert(proof.value.equals(OptimizedSparseMerkleTree.emptyBuffer))
      assert(proof.key.equals(ZERO))
      assert(proof.siblings.length === 2)

      let hash: Buffer = zeroHash
      assert(proof.siblings[1].equals(hash))
      hash = hashFunction(hashBuffer.fill(hash, 0, 32).fill(hash, 32))
      assert(proof.siblings[0].equals(hash))

      assert(proof.rootHash.equals(await tree.getRootHash()))
    })

    it('gets merkle proof for non-empty siblings 0 & 1', async () => {
      const tree: SparseMerkleTree = await createAndVerifyEmptyTreeDepthWithDepth(
        db,
        ZERO,
        3
      )

      const zeroData: Buffer = Buffer.from('ZERO 0')
      await tree.update(ZERO, zeroData)

      const sibs: Buffer[] = [hashFunction(zeroData)]
      sibs.push(
        hashFunction(hashBuffer.fill(zeroHash, 0, 32).fill(zeroHash, 32))
      )
      assert(
        await tree.verifyAndStore({
          rootHash: await tree.getRootHash(),
          value: OptimizedSparseMerkleTree.emptyBuffer,
          key: ONE,
          siblings: sibs.reverse(),
        }),
        'Verifying empty leaf at ONE failed'
      )

      const oneData: Buffer = Buffer.from('ONE 1')
      assert(await tree.update(ONE, oneData), 'Updating data at ONE failed')

      // Check Proof for ZERO
      let proof: MerkleTreeInclusionProof = await tree.getMerkleProof(
        ZERO,
        zeroData
      )

      assert(proof.value.equals(zeroData))
      assert(proof.key.equals(ZERO))

      assert(proof.siblings.length === 2)
      let hash: Buffer = hashFunction(oneData)
      assert(proof.siblings[1].equals(hash))
      hash = hashFunction(hashBuffer.fill(zeroHash, 0, 32).fill(zeroHash, 32))
      assert(proof.siblings[0].equals(hash))

      assert(proof.rootHash.equals(await tree.getRootHash()))

      // Check Proof for ONE
      proof = await tree.getMerkleProof(ONE, oneData)

      assert(proof.value.equals(oneData))
      assert(proof.key.equals(ONE))

      assert(proof.siblings.length === 2)
      hash = hashFunction(zeroData)
      assert(proof.siblings[1].equals(hash))
      hash = hashFunction(hashBuffer.fill(zeroHash, 0, 32).fill(zeroHash, 32))
      assert(proof.siblings[0].equals(hash))

      assert(proof.rootHash.equals(await tree.getRootHash()))
    })

    it('gets merkle proof for non-empty siblings 0 & 2', async () => {
      const tree: SparseMerkleTree = await createAndVerifyEmptyTreeDepthWithDepth(
        db,
        ZERO,
        3
      )

      const zeroData: Buffer = Buffer.from('ZERO 0')
      await tree.update(ZERO, zeroData)

      const sibs: Buffer[] = [zeroHash]
      sibs.push(
        hashFunction(
          hashBuffer.fill(hashFunction(zeroData), 0, 32).fill(zeroHash, 32)
        )
      )
      assert(
        await tree.verifyAndStore({
          rootHash: await tree.getRootHash(),
          value: OptimizedSparseMerkleTree.emptyBuffer,
          key: TWO,
          siblings: sibs.reverse(),
        }),
        'Verifying and storing empty data at TWO failed'
      )

      const twoData: Buffer = Buffer.from('TWO 2')
      assert(await tree.update(TWO, twoData), 'Updating data at TWO failed')

      // Check Proof for ZERO
      let proof: MerkleTreeInclusionProof = await tree.getMerkleProof(
        ZERO,
        zeroData
      )

      assert(proof.value.equals(zeroData))
      assert(proof.key.equals(ZERO))

      assert(proof.siblings.length === 2)

      let hash: Buffer = zeroHash
      assert(proof.siblings[1].equals(hash))
      hash = hashFunction(
        hashBuffer.fill(hashFunction(twoData), 0, 32).fill(zeroHash, 32)
      )
      assert(proof.siblings[0].equals(hash))
      assert(proof.rootHash.equals(await tree.getRootHash()))

      // Check Proof for TWO
      proof = await tree.getMerkleProof(TWO, twoData)

      assert(proof.value.equals(twoData))
      assert(proof.key.equals(TWO))

      assert(proof.siblings.length === 2)

      hash = zeroHash
      assert(proof.siblings[1].equals(hash))
      hash = hashFunction(
        hashBuffer.fill(hashFunction(zeroData), 0, 32).fill(zeroHash, 32)
      )
      assert(proof.siblings[0].equals(hash))

      assert(proof.rootHash.equals(await tree.getRootHash()))
    })
  })
})
