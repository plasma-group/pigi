pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/**
 * @title DataTypes
 * @notice TODO
 */
contract DataTypes {

    /*** Structs ***/
    struct Block {
        bytes32 rootHash;
        uint blockSize;
    }

    struct Transition {
        bytes transaction;
        bytes32 postState;
    }

    struct TransitionInclusionProof {
        uint blockNumber;
        uint transitionIndex;
        uint path;
        bytes32[] siblings;
    }

    struct IncludedTransition {
        Transition transition;
        TransitionInclusionProof inclusionProof;
    }

    struct Storage {
        address pubkey;
        uint8 uniBalance;
        uint8 pigiBalance;
    }

    struct StorageInclusionProof {
        uint path;
        bytes32[] siblings;
    }

    struct IncludedStorage {
        Storage value;
        StorageInclusionProof inclusionProof;
    }
}
