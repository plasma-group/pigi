pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* Internal Imports */
import {DataTypes as dt} from "./DataTypes.sol";

interface TransitionEvaluator {
    function evaluateTransition(
        bytes calldata _tx,
        dt.StorageSlot[] calldata storageSlots
    ) external returns(bytes32[2] memory);
}
