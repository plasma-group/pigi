pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* Internal Imports */
import {DataTypes as dt} from "./DataTypes.sol";
import {SparseMerkleTreeLib} from "./SparseMerkleTreeLib.sol";

contract RollupChain {
    /* Fields */
    dt.Block[] public blocks;
    bytes32 public ZERO_BYTES32 = 0x0000000000000000000000000000000000000000000000000000000000000000;
    bytes32[3] private FAILED_TX_OUTPUT = [ZERO_BYTES32, ZERO_BYTES32, ZERO_BYTES32];
    bool public halted = false;
    // Tx types
    uint NEW_ACCOUNT_TRANSFER_TYPE = 0;
    uint STORED_ACCOUNT_TRANSFER_TYPE = 1;
    uint SWAP_TYPE = 2;

    /* We need to keep a tree in storage which we will use for proving invalid transitions */
    using SparseMerkleTreeLib for SparseMerkleTreeLib.SparseMerkleTree;
    SparseMerkleTreeLib.SparseMerkleTree partialState;

    /* Methods */
    function isHalted() public view returns(bool) {
        return halted;
    }

    /**
     * Submits a new block which is then rolled up.
     */
    function submitBlock(bytes[] memory _block) public returns(bytes32) {
        bytes32 root = SparseMerkleTreeLib.getMerkleRoot(_block);
        dt.Block memory rollupBlock = dt.Block({
            rootHash: root,
            blockSize: _block.length
        });
        blocks.push(rollupBlock);
        return root;
    }

    /**
     * Helper function which checks if a given value fits in a uint8
     */
    function isUint32(bytes32 value) private pure returns(bool) {
        // To check if something is a uint8 we will just check to see that
        // it has no values past the 8th byte. Note this checks "does this value fit in a uint8"
        // not if it was intended to be a uint8 or not
        bytes32 mask = 0x1111111111111111111111111111111111111111111111111111111100000000;
        bytes32 resultingValue = value & mask;
        return resultingValue == 0;
    }

    /**
     * Cast bytes to the a specific tx type
     */
    function inferTxType(
        bytes memory _tx
    ) public view returns(uint) {
        // 128 is the length of a transfer tx
        if (_tx.length == 128) {
            // We're a swap for sure
            return SWAP_TYPE;
        }
        // Otherwise we're a transfer for sure... but which kind?
        (bytes32 tokenType, bytes32 account, bytes32 amount) = abi.decode(_tx, (bytes32, bytes32, bytes32));
        // Now we need to check if the account is a uint8 or if it's a real address
        if (isUint32(account)) {
            // If it is that means we're referencing a stored value.
            // Note you can fool this check if you have an account that fit into a uint8.
            // Long term we will want to stop padding our encoded values to remove this possibility.
            return STORED_ACCOUNT_TRANSFER_TYPE;
        }
        // Otherwise we must be dealing with a new account!
        return NEW_ACCOUNT_TRANSFER_TYPE;
    }


    /*******************************
     * Transaction Execution Logic *
     ******************************/

    /**
     * Mock the execution of a tx
     */
    function mockExecuteTx(
        uint _storageNonce,
        dt.IncludedStorage[2] memory _includedStorage,
        dt.SignedTx memory _signedTx
    ) public returns(bytes32[3] memory) {
        bytes32[3] memory outputs = applyStoredAccountTransfer(_storageNonce, _includedStorage, _signedTx);
        // Check if we returned a fail
        if (outputs[2] == FAILED_TX_OUTPUT[2]) {
            halted = true;
        }
        // Return the output!
        return outputs;
    }

    function verifyEcdsaSignature(bytes memory _signature, address _pubkey) private pure returns(bool) {
        return true;
    }

    /**
     * Apply a transfer tx to an already stored storage slot
     */
    function applyStoredAccountTransfer(
        uint _storageNonce,
        dt.IncludedStorage[2] memory _includedStorage,
        dt.SignedTx memory _signedTx
    ) public view returns(bytes32[3] memory) {
        // First decode the tx into a transfer tx
        dt.TransferTx memory transferTx = abi.decode(_signedTx.body, (dt.TransferTx));
        uint32 maxSendable = _includedStorage[0].value.balances[transferTx.tokenType];
        if (
            // Assert that the 1st storage slot matches the sender's signature
            !verifyEcdsaSignature(_signedTx.signature, _includedStorage[0].value.pubkey) ||
            // Assert that the 2nd storage slot matches the recipient
            transferTx.recipient != uint32(_includedStorage[1].inclusionProof.path) ||
            // Assert that the sender can afford the transaction
            transferTx.amount > maxSendable
        ) {
            // If any of these checks fail, then return a failed tx output
            return FAILED_TX_OUTPUT;
        }
        // The tx seems to be valid, so let's update the balances
        _includedStorage[0].value.balances[transferTx.tokenType] -= transferTx.amount;
        _includedStorage[1].value.balances[transferTx.tokenType] += transferTx.amount;
        // Return the outputes -- the storage hashes & storage nonce
        bytes32[3] memory outputs;
        outputs[0] = getStorageHash(_includedStorage[0].value);
        outputs[1] = getStorageHash(_includedStorage[1].value);
        outputs[2] = bytes32(_storageNonce);
        return outputs;
    }

    /**********************
     * Proving Invalidity *
     *********************/

    /**
     * Verify inclusion of the claimed includedStorage & store their results.
     * Note the complexity here is we need to store an empty storage slot as being 32 bytes of zeros
     * to be what the sparse merkle tree expects.
     */
    function verifyAndStoreStorageInclusionProof(dt.IncludedStorage memory _includedStorage) private {
        // First check if the storage is empty
        if (_includedStorage.value.pubkey == 0x0000000000000000000000000000000000000000) {
            // Verify and store an empty hash because the storage is empty
            partialState.verifyAndStore(
                _includedStorage.inclusionProof.path,
                ZERO_BYTES32,
                _includedStorage.inclusionProof.siblings
            );
        } else {
            partialState.verifyAndStore(
                _includedStorage.inclusionProof.path,
                getStorageHash(_includedStorage.value),
                _includedStorage.inclusionProof.siblings
            );
        }
    }

    /**
     * Checks if a transition is invalid and if it is records it & halts
     * the chain.
     */
    function proveTransitionInvalid(
        dt.IncludedTransition memory _preStateTransition,
        dt.IncludedTransition memory _invalidTransition,
        dt.IncludedStorage[2] memory _inputStorage
    ) public {
        verifySequentialTransitions(_preStateTransition, _invalidTransition);
        bytes32 preStateRoot = _preStateTransition.transition.postState;
        bytes32 postStateRoot = _invalidTransition.transition.postState;
        partialState.root = preStateRoot;
        // The storage nonce is always the last sibling
        uint storageNonce = uint(_inputStorage[0].inclusionProof.siblings[_inputStorage[0].inclusionProof.siblings.length - 1]);

        // First we must verify and store the storage inclusion proofs
        for (uint i = 0; i < _inputStorage.length; i++) {
            verifyAndStoreStorageInclusionProof(_inputStorage[i]);
        }

        // Now that we've verified and stored our storage in the state tree, lets apply the transaction
        bytes32[3] memory outputs = mockExecuteTx(storageNonce, _inputStorage, _invalidTransition.transition.signedTx);
        // First lets verify that the tx was successful. If it wasn't then our accountNonce will equal zero
        if (outputs[2] == ZERO_BYTES32) {
            halted = true;
            return;
        }

        // The transaction succeeded, now we need to check if the state root is incorrect
        for (uint i = 0; i < _inputStorage.length; i++) {
            partialState.update(_inputStorage[i].inclusionProof.path, outputs[i]);
        }
        // The state root MUST be incorrect for us to proceed in halting the chain!
        require(postStateRoot != partialState.root, 'postStateRoot must be different than the transaction result to be invalid.');

        // Halt the chain because we found an invalid post state root! Cryptoeconomic validity ftw!
        halted = true;
    }

    /**
     * Verifies that two transitions were included one after another.
     * This is used to make sure we are comparing the correct
     * prestate & poststate.
     */
    function verifySequentialTransitions(
        dt.IncludedTransition memory _transition0,
        dt.IncludedTransition memory _transition1
    ) public returns(bool) {
        // Verify inclusion
        require(checkTransitionInclusion(_transition0), 'The first transition must be included!');
        require(checkTransitionInclusion(_transition1), 'The second transition must be included!');

        // Verify that the two transitions are one after another

        // Start by checking if they are in the same block
        if (_transition0.inclusionProof.blockNumber == _transition1.inclusionProof.blockNumber) {
            // If the blocknumber is the same, simply check that transition0 preceeds transition1
            require(_transition0.inclusionProof.transitionIndex == _transition1.inclusionProof.transitionIndex - 1, 'Transitions must be sequential!');
            // Hurray! The transition is valid!
            return true;
        }

        // If not in the same block, we check that:
        // 0) the blocks are one after another
        require(_transition0.inclusionProof.blockNumber == _transition1.inclusionProof.blockNumber - 1, 'Blocks must be one after another or equal.');
        // 1) the transitionIndex of transition0 is the last in the block; and
        require(_transition0.inclusionProof.transitionIndex == blocks[_transition0.inclusionProof.blockNumber].blockSize - 1, '_transition0 must be last in its block.');
        // 2) the transitionIndex of transition1 is the first in the block
        require(_transition1.inclusionProof.transitionIndex == 0, '_transition0 must be first in its block.');

        // Success!
        return true;
    }

    /**
     * Check to see if a transition was indeed included.
     */
    function checkTransitionInclusion(dt.IncludedTransition memory _includedTransition) public view returns(bool) {
        // bytes32 rootHash = blocks[_includedTransition.inclusionProof.blockNumber].rootHash;
        // bytes32 transitionHash = getTransitionHash(_includedTransition.transition);
        // bool isIncluded =  SparseMerkleTreeLib.verify(
        //     rootHash,
        //     transitionHash,
        //     _includedTransition.inclusionProof.path,
        //     _includedTransition.inclusionProof.siblings
        // );
        // return isIncluded;

        // TODO: Actually check inclusion. Mock this until we build an SMT inclusion proof checker.
        return true;
    }

    /**
     * Get the hash of the transition.
     */
    function getTransitionHash(dt.Transition memory _transition) public pure returns(bytes32) {
        // Here we don't use `abi.encode([struct])` because it's not clear
        // how to generate that encoding client-side.
        return keccak256(
            abi.encode(
                _transition.signedTx.signature,
                _transition.signedTx.body,
                _transition.postState
            )
        );
    }

    /**
     * Get the hash of the storage value.
     */
    function getStorageHash(dt.Storage memory _storage) public pure returns(bytes32) {
        // Here we don't use `abi.encode([struct])` because it's not clear
        // how to generate that encoding client-side.
        return keccak256(abi.encode(_storage.pubkey, _storage.balances[0], _storage.balances[1]));
    }
}
