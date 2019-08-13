pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* External Imports */
import "openzeppelin-solidity/contracts/math/Math.sol";

/* Internal Imports */
import {DataTypes as types} from "./DataTypes.sol";
import {UniversalAdjudicator} from "./UniversalAdjudicator.sol";

/**
 * @title BooleanIdentityDecider
 * @notice TODO
 */
contract BooleanIdentityDecider {
    struct BooleanIdentityInput {
        bool inputBool;
    }

    UniversalAdjudicator adjudicator;

    constructor(address _adjudicator) public {
        adjudicator = UniversalAdjudicator(_adjudicator);
    }

    function decideTrue(BooleanIdentityInput memory _input, bytes memory _witness) public {
        // Check that the input is `true`
        require(_input.inputBool == true, "inputBool must be `true` to decide true!");
        // Construct a property which will be decided true
        types.Property memory trueProperty = types.Property({
            decider: address(this),
            input: abi.encode(_input)
        });
        // Decide our true property
        adjudicator.decideProperty(trueProperty, true);
    }

    function decideFalse(BooleanIdentityInput memory _input, bytes memory _witness) public {
        // Check that the input is `false`
        require(_input.inputBool == false, "inputBool must be `false` to decide false!");
        // Construct a property which will be decided false
        types.Property memory falseProperty = types.Property({
            decider: address(this),
            input: abi.encode(_input)
        });
        // Decide our false property
        adjudicator.decideProperty(falseProperty, false);
    }
}
