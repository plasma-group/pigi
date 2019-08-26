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
    ) public {
        require(checkTransitionInclusion(_transition0), 'The first transition must be included!');
        require(checkTransitionInclusion(_transition1), 'The second transition must be included!');
    }

    /*
     * Check to see if a transition was indeed included.
     */
    function checkTransitionInclusion(IncludedTransition memory _includedTransition) public view returns(bool) {
        bytes32 rootHash = blocks[_includedTransition.inclusionProof.blockNumber].rootHash;
        bytes32 transitionHash = getTransitionHash(_includedTransition.transition);
        bool isIncluded =  RollupMerkleUtils.verify(
            rootHash,
            transitionHash,
            _includedTransition.inclusionProof.path,
            _includedTransition.inclusionProof.siblings
        );
        return isIncluded;
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
