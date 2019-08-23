pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* Internal Imports */
import {DataTypes as dt} from "./DataTypes.sol";
import {RollupMerkleUtils} from "./RollupMerkleUtils.sol";

contract RollupChain {
    function submitBlock(bytes[] memory _block) public pure returns(bytes32) {
        return RollupMerkleUtils.getMerkleRoot(_block);
    }
}
