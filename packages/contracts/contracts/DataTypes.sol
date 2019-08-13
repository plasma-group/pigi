pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/**
 * @title DataTypes
 * @notice TODO
 */
contract DataTypes {

    /*** Structs ***/
    struct Property {
        address decider;
        bytes input;
    }

    struct Claim {
        uint64 numProvenContradictions;
        uint256 decidedAfter;
    }
}
