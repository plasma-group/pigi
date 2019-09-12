pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* Internal Imports */
import {DataTypes as dt} from "./DataTypes.sol";
import {SparseMerkleTreeLib} from "./SparseMerkleTreeLib.sol";

interface TransitionEvaluator {
    function evaluateTransition(
        dt.SignedTx calldata _signedTx,
        dt.IncludedStorage[] calldata storageSlots
    ) external returns(bytes32[2] memory);
}
