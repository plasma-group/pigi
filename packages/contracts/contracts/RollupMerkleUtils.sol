pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* Internal Imports */
import {DataTypes as dt} from "./DataTypes.sol";

/*
 * Merkle Tree Utilities for Rollup
 */
contract RollupMerkleUtils {
    bytes32[160] public defaultHashes;
    // This struct contains a partial sparse merkle tree
    struct SparseMerkleTree {
        bytes32 root;
        uint height;
        mapping (bytes32 => bytes32) nodes;
    }
    SparseMerkleTree public tree;

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
                nodes[i] = getParent(nodes[i*2], nodes[i*2 + 1]);
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
    function getParent(bytes32 _left, bytes32 _right) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(_left, _right));
    }

    function getNthBitFromRight(uint intVal, uint index) public pure returns (uint8) {
        return uint8(intVal >> index & 1);
    }

    /**
     * Utility Functions for getting & setting values in the SMT
     */
    function storeNode(bytes32 parentHash, bytes32 leftChild, bytes32 rightChild) public {
        tree.nodes[getLeftSiblingKey(parentHash)] = leftChild;
        tree.nodes[getRightSiblingKey(parentHash)] = rightChild;
    }

    function getChildren(bytes32 parentHash) public view returns(bytes32, bytes32) {
        return (tree.nodes[getLeftSiblingKey(parentHash)], tree.nodes[getRightSiblingKey(parentHash)]);
    }

    function getRightSiblingKey(bytes32 parentHash) public pure returns(bytes32) {
        return parentHash | 0x1100000000000000000000000000000000000000000000000000000000000000;
    }

    function getLeftSiblingKey(bytes32 parentHash) public pure returns(bytes32) {
        return parentHash & 0x0011111111111111111111111111111111111111111111111111111111111111;
    }

    function setMerkleRootAndHeight(bytes32 _root, uint _height) public {
        tree.root = _root;
        tree.height = _height;
    }

    /**
     * Update the stored merkle tree
     */
    function updateTree(bytes memory _dataBlock, uint _path) public {
        bytes32[] memory siblings = getSiblings(_path);
        storeMerkleProof(_dataBlock, _path, siblings);
    }

    function getRoot() public view returns(bytes32) {
        return tree.root;
    }

    /**
     * @notice Store a particular merkle proof
     * @param _dataBlock The data block we're verifying inclusion for.
     * @param _path The path from the leaf to the root.
     * @param _siblings The sibling nodes along the way.
     * @return The next level of the tree
     */
    function storeMerkleProof(bytes memory _dataBlock, uint _path, bytes32[] memory _siblings) public {
        // First compute the leaf node
        bytes32 computedNode = keccak256(_dataBlock);
        for (uint i = 0; i < _siblings.length; i++) {
            bytes32 parent;
            bytes32 sibling = _siblings[i];
            uint8 isComputedRightSibling = getNthBitFromRight(_path, i);
            if (isComputedRightSibling == 0) {
                parent = getParent(computedNode, sibling);
                // Store the node!
                storeNode(parent, computedNode, sibling);
            } else {
                parent = getParent(sibling, computedNode);
                // Store the node!
                storeNode(parent, sibling, computedNode);
            }
            computedNode = parent;
        }
        // Store the new root
        tree.root = computedNode;
    }

    /**
     * Get the stored siblings
     */
    function getSiblings(uint _path) public view returns (bytes32[] memory) {
        bytes32[] memory siblings = new bytes32[](tree.height);
        bytes32 computedNode = tree.root;
        for(uint i = tree.height; i > 0; i--) {
            uint siblingIndex = i-1;
            (bytes32 leftChild, bytes32 rightChild) = getChildren(computedNode);
            if (getNthBitFromRight(_path, siblingIndex) == 0) {
                computedNode = leftChild;
                siblings[siblingIndex] = rightChild;
            } else {
                computedNode = rightChild;
                siblings[siblingIndex] = leftChild;
            }
        }
        // Now store everything
        return siblings;
    }

    /**
     * @notice Verify an inclusion proof.
     * @param _root The root of the tree we are verifying inclusion for.
     * @param _dataBlock The data block we're verifying inclusion for.
     * @param _path The path from the leaf to the root.
     * @param _siblings The sibling nodes along the way.
     * @return The next level of the tree
     */
    function verify(bytes32 _root, bytes memory _dataBlock, uint _path, bytes32[] memory _siblings) public pure returns (bool) {
        // First compute the leaf node
        bytes32 computedNode = keccak256(_dataBlock);
        for (uint i = 0; i < _siblings.length; i++) {
            bytes32 sibling = _siblings[i];
            uint8 isComputedRightSibling = getNthBitFromRight(_path, i);
            if (isComputedRightSibling == 0) {
                computedNode = getParent(computedNode, sibling);
            } else {
                computedNode = getParent(sibling, computedNode);
            }
        }
        // Check if the computed node (_root) is equal to the provided root
        return computedNode == _root;
    }
}
