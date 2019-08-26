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

    /* Functions */
    function submitBlock(bytes[] memory _block) public returns(bytes32) {
        bytes32 root = RollupMerkleUtils.getMerkleRoot(_block);
        Block memory rollupBlock = Block({
            rootHash: root,
            blockSize: _block.length
        });
        blocks.push(rollupBlock);
        return root;
    }

    function proveTransitionInvalid(
        IncludedTransition memory _prestateTransition,
        IncludedTransition memory _invalidTransition,
        IncludedStorage[] memory _inputStorage
    ) public {
    }

    function verifySequentialTransitions(
        IncludedTransition memory _transition0,
        IncludedTransition memory _transition1
    ) public {
        require(checkTransitionInclusion(_transition0), 'The first transition must be included!');
        require(checkTransitionInclusion(_transition1), 'The second transition must be included!');
    }

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

    function getTransitionHash(dt.Transition memory _transition) public pure returns(bytes32) {
        return keccak256(abi.encode(_transition.transaction, _transition.postState));
    }
}
