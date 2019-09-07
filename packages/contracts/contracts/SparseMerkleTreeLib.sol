pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/*
 * Sparse Merkle Tree Solidity Implementation.
 */
library SparseMerkleTreeLib {
    struct SparseMerkleTree {
        bytes32 root;
        mapping (bytes32 => bytes) nodes;
    }

    function verifyAndStore(SparseMerkleTree storage _tree, bytes memory _key, bytes32 _leaf, uint _path, bytes32[] memory _siblings) public {
        // TODO: Implement
    }

    /**
     * @notice Get the merkle root computed from some set of data blocks.
     * @param _dataBlocks The data being used to generate the tree.
     * @return the merkle tree root
     */
    function getMerkleRoot(bytes[] memory _dataBlocks) public pure returns(bytes32) {
        return 0x0000000000000000000000000000000000000000000000000000000000000000;
    }

    /**
     * @notice Verify an inclusion proof of an arbitrary merkle tree.
     * @param _root The root of the tree we are verifying inclusion for.
     * @param _leaf The leaf of the tree we are verifying inclusion for.
     * @param _path The path from the leaf to the root.
     * @param _siblings The sibling nodes along the way.
     * @return The next level of the tree
     */
    function verify(bytes32 _root, bytes32 _leaf, uint _path, bytes32[] memory _siblings) public pure returns (bool) {
        return true;
    }
}
