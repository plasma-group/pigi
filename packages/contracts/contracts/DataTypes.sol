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
        uint32 inputAmount;
        uint32 minOutputAmount;
        uint timeout;
    }

    struct TransferTx {
        bytes signature;
        uint tokenType;
        address recipient;
        uint32 amount;
    }

    /*** Tx Data ***/
    struct TransferNewAccountTxData {
        bytes signature;
        address recipientPubkey;
        uint tokenType;
        uint32 amount;
    }

    struct TransferStoredAccountTxData {
        bytes signature;
        uint tokenType;
        uint32 amount;
    }

    struct SwapTxData {
        bytes signature;
        uint tokenType;
        uint32 inputAmount;
        uint32 minOutputAmount;
        uint timeout;
    }

    /*** Transitions ***/
    struct Transition {
        bytes32 postState;
        uint32[2] accessList;
        bytes txData;
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
        uint32[2] balances;
    }

    struct StorageSlot {
        address slotIndex;
        Storage value;
    }

    struct IncludedStorage {
        StorageSlot storageSlot;
        bytes32[] siblings;
    }
}
