pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/**
 * @title DataTypes
 * @notice TODO
 */
contract DataTypes {

    /*** Blocks ***/
    struct Block {
        bytes32 rootHash;
        uint blockSize;
    }

    /*** Transactions ***/
    struct SwapTransaction {
        bool tokenType;
        uint8 inputAmount;
        uint8 minOutputAmount;
        uint timeout;
    }

    struct TransferTransaction {
        bool tokenType;
        uint8 recipient;
        uint8 amount;
    }

    struct TransferNewAddressTransaction {
        bool tokenType;
        address recipient;
        uint8 amount;
    }

    struct SignedTransaction {
        bytes signature;
        bytes transaction;
    }

    /*** Transitions ***/
    struct Transition {
        SignedTransaction signedTransaction;
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

    /*** Storage ***/
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
