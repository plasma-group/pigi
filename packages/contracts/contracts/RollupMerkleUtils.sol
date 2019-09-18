pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* Internal Imports */
import {DataTypes as dt} from "./DataTypes.sol";

/*
 * Merkle Tree Utilities for Rollup
 */
contract RollupMerkleUtils {
    bytes32[160] public defaultHashes;

    constructor() public {
        setDefaultHashes();
    }

    function setDefaultHashes() private {
        // Set the initial default hash.
        // TODO: Replace this hardcoded bytes value with keccak256(0x000...000) or similar.
        defaultHashes[0] = 0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563;
        for (uint i = 1; i < defaultHashes.length; i ++) {
            defaultHashes[i] = keccak256(abi.encodePacked(defaultHashes[i-1], defaultHashes[i-1]));
        }
    }

    /**
     * @notice Get the sparse merkle root computed from some set of data blocks.
     * @param _dataBlocks The data being used to generate the tree.
     * @return the sparse merkle tree root
     */
    function getMerkleRoot(bytes[] calldata _dataBlocks) external view returns(bytes32) {
        uint nextLevelLength = _dataBlocks.length;
        uint currentLevel = 0;
        bytes32[] memory nodes = new bytes32[](nextLevelLength + 1); // Add one in case we have an odd number of leaves
        // Generate the leaves
        for (uint i = 0; i < _dataBlocks.length; i++) {
            nodes[i] = keccak256(_dataBlocks[i]);
        }
        if (_dataBlocks.length == 1) {
            return nodes[0];
        }
        // Add a defaultNode if we've got an odd number of leaves
        if (nextLevelLength % 2 == 1) {
            nodes[nextLevelLength] = defaultHashes[currentLevel];
            nextLevelLength += 1;
        }

        // Now generate each level
        while (nextLevelLength > 1) {
            currentLevel += 1;
            // Calculate the nodes for the currentLevel
            for (uint i = 0; i < nextLevelLength / 2; i++) {
                nodes[i] = parent(nodes[i*2], nodes[i*2 + 1]);
            }
            nextLevelLength = nextLevelLength / 2;
            // Check if we will need to add an extra node
            if (nextLevelLength % 2 == 1 && nextLevelLength != 1) {
                nodes[nextLevelLength] = defaultHashes[currentLevel];
                nextLevelLength += 1;
            }
        }

        // Alright! We should be left with a single node! Return it...
        return nodes[0];
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
    function verify(bytes32 _root, bytes32 _leaf, uint _path, bytes32[] memory _siblings) public pure returns (bool) {
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
