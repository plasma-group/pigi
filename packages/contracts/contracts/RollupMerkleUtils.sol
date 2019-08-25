pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* Internal Imports */
import {DataTypes as dt} from "./DataTypes.sol";

/*
 * Merkle Tree Utilities for Rollup
 */
library RollupMerkleUtils {

    /**
     * @notice Get the merkle root computed from some set of data blocks.
     * @param _dataBlocks The data being used to generate the tree.
     * @return the merkle tree root
     */
    function getMerkleRoot(bytes[] memory _dataBlocks) public pure returns(bytes32) {
        uint dataBlocksLength = _dataBlocks.length;
        bytes32[] memory leaves = new bytes32[](dataBlocksLength);
        for (uint i = 0; i < dataBlocksLength; i++) {
            leaves[i] = keccak256(_dataBlocks[i]);
        }
        while (leaves.length > 1) {
            leaves = generateNextLevel(leaves);
        }
        return leaves[0];
    }

    /**
     * @notice Get the parent of two children nodes in the tree
     * @param _left The left child
     * @param _right The right child
     * @return The parent node
     */
    function parent(bytes32 _left, bytes32 _right) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(_left, _right));
    }

    /**
     * @notice Generate the next level of the merkle tree
     * @param _prevLevel An array containing the hashes which make up
                         the previous level in the merkle tree
     * @return The next level of the tree
     */
    function generateNextLevel(bytes32[] memory _prevLevel) private pure returns(bytes32[] memory) {
        uint prevLevelLength = _prevLevel.length;
        uint remainder = prevLevelLength % 2;
        uint nextLevelLength = (prevLevelLength / 2) + remainder;
        bytes32[] memory nextLevel = new bytes32[](nextLevelLength);
        // Calculate all parent nodes except the last one
        for(uint i = 0; i < nextLevelLength-1; i++) {
            uint prevLevelIndex = i*2;
            nextLevel[i] = parent(_prevLevel[prevLevelIndex], _prevLevel[prevLevelIndex+1]);
        }
        // Set the last node to be either the hash
        if (remainder == 0) {
            nextLevel[nextLevelLength-1] = keccak256(abi.encodePacked(_prevLevel[prevLevelLength-2], _prevLevel[prevLevelLength-1]));
        } else {
            nextLevel[nextLevelLength-1] = _prevLevel[prevLevelLength - 1];
        }
        return nextLevel;
    }

    function getNthBitFromRight(uint self, uint8 index) public pure returns (uint8) {
        return uint8(self >> index & 1);
    }

    /**
     * @notice Verify an inclusion proof of an arbitrary merkle tree.
     * @param _root The root of the tree we are verifying inclusion for.
     * @param _leaf The leaf of the tree we are verifying inclusion for.
     * @param _path The path from the leaf to the root.
     * @param _siblings The sibling nodes along the way.
     * @return The next level of the tree
     */
    function verify(bytes32 _root, bytes32 _leaf, uint128 _path, bytes32[] memory _siblings) public pure returns (bool) {
        bytes32 computedNode = _leaf;
        for (uint8 i = 0; i < _siblings.length; i++) {
            bytes32 sibling = _siblings[i];
            uint8 isComputedRightSibling = getNthBitFromRight(_path, i);
            if (isComputedRightSibling == 0) {
                computedNode = parent(computedNode, sibling);
            } else {
                computedNode = parent(sibling, computedNode);
            }
        }

        // Check if the computed node (_root) is equal to the provided root
        return computedNode == _root;
    }
}
