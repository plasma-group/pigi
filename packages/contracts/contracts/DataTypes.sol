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

    /*** Txs ***/
    struct SwapTx {
        bytes signature;
        uint tokenType;
        uint40 inputAmount;
        uint40 minOutputAmount;
        uint timeout;
    }

    struct TransferTx {
        bytes signature;
        uint tokenType;
        uint40 recipient;
        uint40 amount;
    }

    struct CreateNewStorageSlotTx {
        uint40 storageSlot;
        address pubkey;
    }

    /*** Transitions ***/
    struct Transition {
        bytes tx;
        bytes32 postState;
    }

    struct TransitionInclusionProof {
        uint blockNumber;
        uint transitionIndex;
        bytes32[] siblings;
    }

    struct IncludedTransition {
        Transition transition;
        TransitionInclusionProof inclusionProof;
    }

    /*** Storage ***/
    struct Storage {
        address pubkey;
        uint40[2] balances;
    }

    struct StorageSlot {
        uint slotIndex;
        Storage value;
    }

    struct IncludedStorage {
        StorageSlot storageSlot;
        bytes32[] siblings;
    }
}
