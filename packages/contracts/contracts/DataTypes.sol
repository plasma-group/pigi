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
        uint tokenType;
        uint32 inputAmount;
        uint32 minOutputAmount;
        uint timeout;
    }

    struct TransferTx {
        uint tokenType;
        uint32 recipient;
        uint32 amount;
    }

    struct TransferNewAddressTx {
        uint tokenType;
        address recipient;
        uint32 amount;
    }

    struct SignedTx {
        bytes signature;
        bytes body;
    }

    /*** Transitions ***/
    struct Transition {
        SignedTx signedTx;
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
