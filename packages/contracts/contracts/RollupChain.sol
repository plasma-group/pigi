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

    /* Events */
    event DecodedTransition(
        bool success,
        bytes returnData
    );

    /* We need to keep a tree in storage which we will use for proving invalid transitions */
    using SparseMerkleTreeLib for SparseMerkleTreeLib.SparseMerkleTree;
    SparseMerkleTreeLib.SparseMerkleTree partialState;

    /***************
     * Constructor *
     **************/
    constructor(address _transitionEvaluatorAddress) public {
        transitionEvaluator = TransitionEvaluator(_transitionEvaluatorAddress);
    }

    /* Methods */
    function isHalted() public view returns(bool) {
        return halted;
    }

    function pruneBlocksAfter(uint blockNumber) internal {
        for (uint i = blockNumber; i < blocks.length; i++) {
            delete blocks[i];
        }
        halted = true;
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
     * Verify inclusion of the claimed includedStorageSlot & store their results.
     * Note the complexity here is we need to store an empty storage slot as being 32 bytes of zeros
     * to be what the sparse merkle tree expects.
     */
    function verifyAndStoreStorageSlotInclusionProof(dt.IncludedStorageSlot memory _includedStorageSlot) private {
        partialState.verifyAndStore(
            uint(_includedStorageSlot.storageSlot.slotIndex),
            getStorageHash(_includedStorageSlot.storageSlot.value),
            _includedStorageSlot.siblings
        );
    }

    function getStateRootsAndStorageSlots(
        bytes memory _preStateTransition,
        bytes memory _invalidTransition
    ) public returns(bool, bytes32, bytes32, uint32[2] memory) {
        bool success;
        bytes memory returnData;
        bytes32 preStateRoot;
        bytes32 postStateRoot;
        uint32[2] memory preStateStorageSlots;
        uint32[2] memory storageSlots;
        // First decode the prestate root
        (success, returnData) =
            address(transitionEvaluator).call(
                abi.encodeWithSelector(transitionEvaluator.getTransitionStateRootAndAccessList.selector, _preStateTransition)
            );
        // Emit the output as an event
        emit DecodedTransition(success, returnData);
        // Make sure the call was successful
        require(success, "If the preStateRoot is invalid, then prove that invalid instead!");
        (preStateRoot, preStateStorageSlots) = abi.decode((returnData), (bytes32, uint32[2]));
        // Now that we have the prestateRoot, let's decode the postState
        (success, returnData) =
            address(transitionEvaluator).call(
                abi.encodeWithSelector(transitionEvaluator.getTransitionStateRootAndAccessList.selector, _invalidTransition)
            );
        // Emit the output as an event
        emit DecodedTransition(success, returnData);
        // If the call was successful let's decode!
        if (success) {
            (postStateRoot, storageSlots) = abi.decode((returnData), (bytes32, uint32[2]));
        }
        return (success, preStateRoot, postStateRoot, storageSlots);
    }

    /**
     * Checks if a transition is invalid and if it is records it & halts
     * the chain.
     */
    function proveTransitionInvalid(
        dt.IncludedTransition memory _preStateIncludedTransition,
        dt.IncludedTransition memory _invalidIncludedTransition,
        dt.IncludedStorageSlot[2] memory _transitionStorageSlots
    ) public {
        // For convenience store the transitions
        bytes memory preStateTransition = _preStateIncludedTransition.transition;
        bytes memory invalidTransition = _invalidIncludedTransition.transition;

        /********* #1: CHECK_SEQUENTIAL_TRANSITIONS *********/
        // First verify that the transitions are sequential
        verifySequentialTransitions(_preStateIncludedTransition, _invalidIncludedTransition);

        /********* #2: DECODE_TRANSITIONS *********/
        // Decode our transitions and determine which storage slots we'll need in order to validate the transition
        (
            bool success,
            bytes32 preStateRoot,
            bytes32 postStateRoot,
            uint32[2] memory storageSlotIndexes
        ) = getStateRootsAndStorageSlots(preStateTransition, invalidTransition);
        // If not success something went wrong with the decoding...
        if (!success) {
            // Prune the block if it has an incorrectly encoded transition!
            pruneBlocksAfter(_invalidIncludedTransition.inclusionProof.blockNumber);
            return;
        }

        /********* #3: VERIFY_TRANSITION_STORAGE_SLOTS *********/
        // Make sure the storage slots we were given are correct
        require(_transitionStorageSlots[0].storageSlot.slotIndex == storageSlotIndexes[0], "First supplied storage slot index is incorrect!");
        require(_transitionStorageSlots[1].storageSlot.slotIndex == storageSlotIndexes[1], "Second supplied storage slot index is incorrect!");

        /********* #4: STORE_STORAGE_INCLUSION_PROOFS *********/
        // Now verify and store the storage inclusion proofs
        for (uint i = 0; i < _transitionStorageSlots.length; i++) {
            verifyAndStoreStorageSlotInclusionProof(_transitionStorageSlots[i]);
        }

        /********* #5: EVALUATE_TRANSITION *********/
        // Now that we've verified and stored our storage in the state tree, lets apply the transaction
        // To do this first let's pull out the two storage slots we care about
        dt.StorageSlot[2] memory storageSlots;
        storageSlots[0] = _transitionStorageSlots[0].storageSlot;
        storageSlots[1] = _transitionStorageSlots[1].storageSlot;
        bytes memory returnData;
        // Make the external call
        (success, returnData) =
            address(transitionEvaluator).call(
                abi.encodeWithSelector(transitionEvaluator.evaluateTransition.selector, invalidTransition, storageSlots)
            );
        // Check if it was successful. If not, we've got to prune.
        if (!success) {
            pruneBlocksAfter(_invalidIncludedTransition.inclusionProof.blockNumber);
            return;
        }
        // It was successful so let's decode the outputs to get the new leaf nodes we'll have to insert
        (bytes32[2] memory outputs) = abi.decode((returnData), (bytes32[2]));

        /********* #6: EVALUATE_TRANSITION *********/
        // Now we need to check if the state root is incorrect, to do this we first insert the new leaf values
        for (uint i = 0; i < _transitionStorageSlots.length; i++) {
            partialState.update(_transitionStorageSlots[i].storageSlot.slotIndex, outputs[i]);
        }

        /********* #7: COMPARE_STATE_ROOTS *********/
        // Check if the calculated state root equals what we expect
        if (postStateRoot != partialState.root) {
            // Prune the block because we found an invalid post state root! Cryptoeconomic validity ftw!
            pruneBlocksAfter(_invalidIncludedTransition.inclusionProof.blockNumber);
            return;
        }

        // Woah! Looks like there's no fraud!
        revert("No fraud detected!");
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
    function getTransitionHash(bytes memory _transition) public pure returns(bytes32) {
        // Here we don't use `abi.encode([struct])` because it's not clear
        // how to generate that encoding client-side.
        return keccak256(_transition);
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
