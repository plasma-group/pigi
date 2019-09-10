pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/**
 * @title DataTypes
 * @notice TODO
 */
contract DataTypes {
    /*** Constants ***/
    uint UNI_TOKEN_TYPE = 0;
    uint PIGI_TOKEN_TYPE = 1;

    /*** Blocks ***/
    struct Block {
        bytes32 rootHash;
        uint blockSize;
    }

    /*** Transactions ***/
    struct SwapTransaction {
        uint tokenType;
        uint32 inputAmount;
        uint32 minOutputAmount;
        uint timeout;
    }

    struct TransferTransaction {
        uint tokenType;
        uint32 recipient;
        uint32 amount;
    }

    struct TransferNewAddressTransaction {
        uint tokenType;
        address recipient;
        uint32 amount;
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
        uint32[2] balances;
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
