pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* External Imports */
import "openzeppelin-solidity/contracts/math/Math.sol";

/* Internal Imports */
import {DataTypes as types} from "./DataTypes.sol";

/**
 * @title UniversalAdjudicator
 * @notice TODO
 */
contract UniversalAdjudicator {
    // Mapping of claimId -> claim, where claimId == hash(property)
    mapping(bytes32=>types.Claim) public claims;

    /* 
     * Helpers
     */ 
    function getClaimId(types.Property memory _property) public pure returns (bytes32) {
        return keccak256(abi.encode(_property));
    }

    function getClaim(bytes32 claimId) public view returns (types.Claim memory) {
        return claims[claimId];
    }

    function claimExists(bytes32 claimId) public view returns (bool) {
        return claims[claimId].decidedAfter != 0 || claims[claimId].numProvenContradictions != 0;
    }

    function isDecided(bytes32 claimId) public view returns (bool) {
        return claims[claimId].decidedAfter < block.timestamp;
    }

    /*
     * Core Logic
     */
    function claimProperty(types.Property memory _property) public returns(bool) {
        // Get the claimId -- a unique ID for this particular property
        bytes32 claimId = getClaimId(_property);
        // Check that we don't already have a claim for this property
        require(!claimExists(claimId), "A claim for this property already exists!");
        // Construct a Claim for this 
        claims[claimId] = types.Claim({
            numProvenContradictions: 0,
            decidedAfter: block.timestamp + 3 hours
        });
        return true;
    }

    function decideProperty(types.Property memory _property, bool decision) public returns(bool) {
        // Verify that the decider is the one calling decideProperty
        require(msg.sender == _property.decider, "decideProperty(...) must only be called by the relevant decider!");
        // Get the claimId
        bytes32 claimId = getClaimId(_property);
        // Decide the claim true
        claims[claimId].decidedAfter = block.timestamp - 1;
        return true;
    }
}
