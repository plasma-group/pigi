pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* Internal Imports */
import {DataTypes as dt} from "./DataTypes.sol";
import {SparseMerkleTreeLib} from "./SparseMerkleTreeLib.sol";

interface TransitionVerifier {
    function verifyTransition(
        bytes32 preStateRoot,
        dt.Transition calldata transition,
        dt.IncludedStorage[] calldata storageSlots
    ) external returns(bool);
}
