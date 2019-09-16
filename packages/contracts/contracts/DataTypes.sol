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
        address sender;
        uint tokenType;
        uint32 inputAmount;
        uint32 minOutputAmount;
        uint timeout;
    }

    struct TransferTx {
        address sender;
        address recipient;
        uint tokenType;
        uint32 amount;
    }

    /*** Transitions ***/
    struct CreateAndTransferTransition {
        bytes32 stateRoot;
        uint32 senderSlot;
        uint32 recipientSlot;
        address recipientPubkey;
        uint tokenType;
        uint32 amount;
        bytes signature;
    }

    struct TransferTransition {
        bytes32 stateRoot;
        uint32 senderSlot;
        uint32 recipientSlot;
        uint tokenType;
        uint32 amount;
        bytes signature;
    }

    struct SwapTransition {
        bytes32 stateRoot;
        uint32 senderSlot;
        uint32 recipientSlot;
        uint tokenType;
        uint32 inputAmount;
        uint32 minOutputAmount;
        uint timeout;
        bytes signature;
    }

    struct TransitionInclusionProof {
        uint blockNumber;
        uint transitionIndex;
        bytes32[] siblings;
    }

    struct IncludedTransition {
        bytes transition; // One of the 3 transition types
        TransitionInclusionProof inclusionProof;
    }

    /*** Storage ***/
    struct Storage {
        address pubkey;
        uint32[2] balances;
    }

    struct StorageSlot {
        uint32 slotIndex;
        Storage value;
    }

    struct IncludedStorage {
        StorageSlot storageSlot;
        bytes32[] siblings;
    }
}
