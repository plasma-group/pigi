pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* Internal Imports */
import {DataTypes as dt} from "./DataTypes.sol";
import {SparseMerkleTreeLib} from "./SparseMerkleTreeLib.sol";

contract RollupChain {
    /* Fields */
    dt.Block[] public blocks;
    /* We need to keep a tree in storage which we will use for proving invalid transitions */
    using SparseMerkleTreeLib for SparseMerkleTreeLib.SparseMerkleTree;
    SparseMerkleTreeLib.SparseMerkleTree fraudTree;

    /* Methods */

    /*
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

    /*
     * Checks if a transition is invalid and if it is records it & halt
     * the chain.
     */
    function proveTransitionInvalid(
        dt.IncludedTransition memory _preStateTransition,
        dt.IncludedTransition memory _invalidTransition,
        dt.IncludedStorage[2] memory _inputStorage
    ) public returns(bool) {
        verifySequentialTransitions(_preStateTransition, _invalidTransition);
        bytes32 preStateRoot = _preStateTransition.transition.postState;
        bytes32 postStateRoot = _invalidTransition.transition.postState;
        fraudTree.root = preStateRoot;
        // Verify inclusion proofs for each input
        for (uint i = 0; i < _inputStorage.length; i++) {
            fraudTree.verifyAndStore(
                _preStateTransition.transition.transaction,
                getStorageHash(_inputStorage[i].value),
                _inputStorage[i].inclusionProof.path,
                _inputStorage[i].inclusionProof.siblings
            );
        }


        /*
        verifyIncludedSequentialTransitions(_prestateTransition, _invalidTransition)
        preStateRoot = _prestateTransition.transition.postState
        transaction = _invalidTransition.transaction
        postStateRoot = _invalidTransition.postState
        const partialState = new SMT(preStateRoot)
        for (const i = 0; i < transaction.inputs.length) {
            txInput = transaction.inputs[i]
            SMTInclusionProof inputProof = {
                key: txInput.account,
                value: inputStorage[i],
                siblings: _inputInclusionProofs[i]
            }
            require(partialState.verifyAndStore(inputProof), 'each tx input must be included in the preState')
        }
        */
        return true;
    }

    /*
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

    /*
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

    /*
     * Get the hash of the transition.
     */
    function getTransitionHash(dt.Transition memory _transition) public pure returns(bytes32) {
        // Here we don't use `abi.encode([struct])` because it's not clear
        // how to generate that encoding client-side.
        return keccak256(abi.encode(_transition.transaction, _transition.postState));
    }

    /*
     * Get the hash of the storage value.
     */
    function getStorageHash(dt.Storage memory _storage) public pure returns(bytes32) {
        // Here we don't use `abi.encode([struct])` because it's not clear
        // how to generate that encoding client-side.
        return keccak256(abi.encode(_storage.pubkey, _storage.uniBalance, _storage.pigiBalance));
    }
}
