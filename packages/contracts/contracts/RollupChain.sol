pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* Internal Imports */
import {DataTypes as dt} from "./DataTypes.sol";
import {SparseMerkleTreeLib} from "./SparseMerkleTreeLib.sol";
import {TransitionEvaluator} from "./TransitionEvaluator.sol";

contract RollupChain {
    /* Fields */
    // The Evaluator for our STF
    TransitionEvaluator transitionEvaluator;
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

    /***************
     * Constructor *
     **************/
    constructor() public {
        // TODO: Initialize a transition Evaluator for this chain
    }

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


    /**********************
     * Proving Invalidity *
     *********************/

    /**
     * Verify inclusion of the claimed includedStorage & store their results.
     * Note the complexity here is we need to store an empty storage slot as being 32 bytes of zeros
     * to be what the sparse merkle tree expects.
     */
    function verifyAndStoreStorageSlotInclusionProof(dt.IncludedStorage memory _includedStorage) private {
        partialState.verifyAndStore(
            uint(_includedStorage.storageSlot.slotIndex),
            getStorageHash(_includedStorage.storageSlot.value),
            _includedStorage.siblings
        );
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

        // First we must verify and store the storage inclusion proofs
        for (uint i = 0; i < _inputStorage.length; i++) {
            verifyAndStoreStorageSlotInclusionProof(_inputStorage[i]);
        }

        // Now that we've verified and stored our storage in the state tree, lets apply the transaction
        // To do this first let's pull out the two storage slots we care about
        dt.StorageSlot[2] memory storageSlots;
        storageSlots[0] = _inputStorage[0].storageSlot;
        storageSlots[1] = _inputStorage[1].storageSlot;
        // TODO: Make this an external call
        bytes32[3] memory outputs;
        bool txSuccessful = true;

        // Here we're going to check
        // 1) did calling evaluateTx throw? if so... well we should throw. THIS MEANS THERE WAS SOMETHING WRONG WITH THE INPUTS
        // 2) did we get the right input but the TX failed? THIS MEANS WE NEED TO HALT
        // Otherwise... we check the outputs to see if they are correctly attributed


        // First lets verify that the tx was successful. If it wasn't then our accountNonce will equal zero
        if (txSuccessful == false) {
            halted = true;
            return;
        }

        // The transaction succeeded, now we need to check if the state root is incorrect
        for (uint i = 0; i < _inputStorage.length; i++) {
            partialState.update(uint(_inputStorage[i].storageSlot.slotIndex), outputs[i]);
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
        //     _includedTransition.inclusionProof.transitionIndex,
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
                _transition.tx,
                _transition.postState
            )
        );
    }

    /**
     * Get the hash of the storage value.
     */
    function getStorageHash(dt.Storage memory _storage) public view returns(bytes32) {
        // If the storage is empty, we return all zeros
        if (_storage.balances[0] == 0 && _storage.balances[1] == 0) {
            return ZERO_BYTES32;
        }
        // Here we don't use `abi.encode([struct])` because it's not clear
        // how to generate that encoding client-side.
        return keccak256(abi.encode(_storage.balances[0], _storage.balances[1]));
    }
}
