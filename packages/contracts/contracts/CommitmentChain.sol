pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* Internal Imports */
import {DataTypes as dt} from "./DataTypes.sol";

contract CommitmentChain {
    function verifyInclusion(dt.StateUpdate memory _stateUpdate, bytes memory _inclusionProof) public returns (bool) {
        // Always return true for now until we can verify inclusion proofs.
        return true;
    }

    // Via https://github.com/ethereum/solidity-examples/blob/master/src/bits/Bits.sol
    // Gets the value of the 'index'th bit (where 0 => rightmost bit) in the binary expression of 'self'.
    function getNthBitFromRight(uint self, uint8 index) public pure returns (uint8) {
        return uint8(self >> index & 1);
    }

    function calculateStateUpdateLeaf(dt.StateUpdate memory _stateUpdate) public pure returns (dt.StateSubtreeNode memory) {
        dt.StateSubtreeNode memory parent;
        parent.hashValue = keccak256(
            abi.encodePacked(
                _stateUpdate.stateObject.predicateAddress,
                _stateUpdate.stateObject.data
            )
        );
        parent.lowerBound = _stateUpdate.range.start;
        return parent;
    }

    function stateSubtreeParent(
        dt.StateSubtreeNode memory _leftSibling,
        dt.StateSubtreeNode memory _rightSibling
    ) public pure returns (dt.StateSubtreeNode memory) {
        require(_leftSibling.lowerBound < _rightSibling.lowerBound, 'Interval tree siblings must be ordered to have a valid parent.');
        dt.StateSubtreeNode memory parent;
        bytes32 computedHash = keccak256(
            abi.encodePacked(
                _leftSibling.hashValue,
                _leftSibling.lowerBound,
                _rightSibling.hashValue,
                _rightSibling.lowerBound
            )
        );
        parent.hashValue = computedHash;
        parent.lowerBound = _leftSibling.lowerBound;
        return parent;
    }

    function verifySubtreeInclusionAndGetRoot(dt.StateUpdate memory _stateUpdate, dt.StateTreeInclusionProof memory _proof) public pure returns (bytes32) {
        dt.StateSubtreeNode memory computedNode = calculateStateUpdateLeaf(_stateUpdate);
        uint128 leafPosition = _proof.stateLeafPosition;
        // all left siblings' lower bound must be increasing from the included SU.end onward
        uint128 previousRightLowerBound = _stateUpdate.range.end;
        for (uint8 level = 0; level < _proof.siblings.length; level++) {
            dt.StateSubtreeNode memory siblingNode = _proof.siblings[level];
            // the binaryPath up the tree is the leafPosition expressed in bits
            uint8 isComputedRightSibling = getNthBitFromRight(leafPosition, level);
            if (isComputedRightSibling == 0) {
                // if binaryPath[level] == 0, the proof element is a right sibling
                computedNode = stateSubtreeParent(computedNode, siblingNode);
                // make sure the sibling does not violate interval proof lowerBound rules
                require(previousRightLowerBound < siblingNode.lowerBound, 'No valid branch allows potential intersections with other branches.');
                // store the new previousRightLowerBound to check against going forward
                previousRightLowerBound = siblingNode.lowerBound;
            } else if (isComputedRightSibling == 1) {
                // otherwise, the proof element is the right sibling
                computedNode = stateSubtreeParent(siblingNode, computedNode);
            }
        }
        return computedNode.hashValue;
    }
    
    function assetTreeParent(
        dt.AssetTreeNode memory _leftSibling,
        dt.AssetTreeNode memory _rightSibling
    ) public pure returns (dt.AssetTreeNode memory) {
        require(_leftSibling.lowerBound < _rightSibling.lowerBound, 'Interval tree siblings must be ordered to have a valid parent.');
        dt.AssetTreeNode memory parent;
        bytes32 computedHash = keccak256(
            abi.encodePacked(
                _leftSibling.hashValue,
                _leftSibling.lowerBound,
                _rightSibling.hashValue,
                _rightSibling.lowerBound
            )
        );
        parent.hashValue = computedHash;
        parent.lowerBound = _leftSibling.lowerBound;
        return parent;
    }

    function verifyAssetTreeInclusionAndGetRoot(bytes32 _stateSubtreeRoot, address _depositAddress, dt.AssetTreeInclusionProof memory _proof) public pure returns (bytes32) {
        dt.AssetTreeNode memory computedNode;
        computedNode.hashValue = _stateSubtreeRoot;
        computedNode.lowerBound = uint256(_depositAddress);
        // leaf position is asset leaf position
        uint128 leafPosition = _proof.assetLeafPosition;
        // since state root leaves don't have a range, we can initialize this to 0
        uint256 previousRightLowerBound = 0;
        for (uint8 level = 0; level < _proof.siblings.length; level++) {
            dt.AssetTreeNode memory siblingNode = _proof.siblings[level];
            // the binaryPath up the tree is the leafPosition expressed in bits
            uint8 isComputedRightSibling = getNthBitFromRight(leafPosition, level);
            if (isComputedRightSibling == 0) {
                // if binaryPath[level] == 0, the proof element is a right sibling
                computedNode = assetTreeParent(computedNode, siblingNode);
                // make sure the sibling does not violate interval proof lowerBound rules
                require(previousRightLowerBound < siblingNode.lowerBound, 'No valid branch allows potential intersections with other branches.');
                // store the new previousRightLowerBound to check against going forward
                previousRightLowerBound = siblingNode.lowerBound;
            } else if (isComputedRightSibling == 1) {
                // otherwise, the proof element is the right sibling
                computedNode = assetTreeParent(siblingNode, computedNode);
            }
        }
        return computedNode.hashValue;
    }
}
