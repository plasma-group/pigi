pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/**
 * @title DataTypes
 * @notice TODO
 */
contract DataTypes {

    /*** Structs ***/
    struct Range {
        uint128 start;
        uint128 end;
    }

    struct StateObject {
        address predicateAddress;
        bytes data;
    }

    struct StateUpdate {
        StateObject stateObject;
        Range range;
        uint128 plasmaBlockNumber;
        address depositAddress;
    }

    struct Checkpoint {
        StateUpdate stateUpdate;
        Range subrange;
    }

    struct Transaction {
        address depositAddress;
        bytes32 methodId;
        bytes parameters;
        Range range;
    }

    struct AssetTreeNode {
        bytes32 hashValue;
        uint256 lowerBound;
    }

    struct StateSubtreeNode {
        bytes32 hashValue;
        uint128 lowerBound;
    }

    struct StateUpdateInclusionProof {
        uint128 stateLeafPosition;
        StateSubtreeNode[] stateLeafInclusionProof;
        uint128 assetLeafPosition;
        AssetTreeNode[] assetLeafInclusionProof;
    }
}
