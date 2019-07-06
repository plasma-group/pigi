pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* Internal Imports */
import {DataTypes as dt} from "./DataTypes.sol";

contract CommitmentChain {
    function verifyInclusion(dt.StateUpdate memory _stateUpdate, bytes memory _inclusionProof) public returns (bool) {
        // Always return true for now until we can verify inclusion proofs.
        return true;
    }

    function isLeftSiblingAtHeight(uint128 leafPosition, uint128 height) public {
        return;
    }

    function recieveProof(dt.StateUpdateInclusionProof memory _proof) public {
        for (uint level = 0; level < _proof.stateLeafInclusionProof.length; level++) {
            
        }
    }

    // Via https://github.com/ethereum/solidity-examples/blob/master/src/bits/Bits.sol
    // Gets the value of the bit at the given 'index' in 'self'.
    function getNthBitFromRightmost(uint self, uint8 index) public pure returns (uint8) {
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
    
    function assetTreeParent(
        dt.AssetTreeNode memory _leftSibling,
        dt.AssetTreeNode memory _rightSibling
    ) public pure returns (dt.AssetTreeNode memory) {
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
}
