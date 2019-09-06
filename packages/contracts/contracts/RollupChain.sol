pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* Internal Imports */
import {DataTypes as dt} from "./DataTypes.sol";
import {RollupMerkleUtils} from "./RollupMerkleUtils.sol";

contract RollupChain {
    /* Structs */
    struct Block {
        bytes32 rootHash;
        uint blockSize;
    }
    struct TransitionInclusionProof {
        uint blockNumber;
        uint transitionIndex;
        uint path;
        bytes32[] siblings;
    }
    struct IncludedTransition {
        dt.Transition transition;
        TransitionInclusionProof inclusionProof;
    }
    struct IncludedStorage {
        bytes value;
        bytes32[] inclusionProof;
    }
    /* Fields */
    Block[] public blocks;

    /* Methods */

    /*
     * Submits a new block which is then rolled up.
     */
    function submitBlock(bytes[] memory _block) public returns(bytes32) {
        bytes32 root = RollupMerkleUtils.getMerkleRoot(_block);
        Block memory rollupBlock = Block({
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
        IncludedTransition memory _prestateTransition,
        IncludedTransition memory _invalidTransition,
        IncludedStorage[] memory _inputStorage
    ) public {
    }

    /*
     * Verifies that two transitions were included one after another.
     * This is used to make sure we are comparing the correct
     * prestate & poststate.
     */
    function verifySequentialTransitions(
        IncludedTransition memory _transition0,
        IncludedTransition memory _transition1
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
    function checkTransitionInclusion(IncludedTransition memory _includedTransition) public view returns(bool) {
        // bytes32 rootHash = blocks[_includedTransition.inclusionProof.blockNumber].rootHash;
        // bytes32 transitionHash = getTransitionHash(_includedTransition.transition);
        // bool isIncluded =  RollupMerkleUtils.verify(
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
        // Here we don't use `abi.encode(_transition)` because it's not clear
        // how to generate that encoding client-side.
        return keccak256(abi.encode(_transition.transaction, _transition.postState));
    }
}
