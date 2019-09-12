pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* Internal Imports */
import {DataTypes as dt} from "./DataTypes.sol";
import {TransitionEvaluator} from "./TransitionEvaluator.sol";

contract UnipigTransitionEvaluator is TransitionEvaluator {
    function evaluateTransition(
        bytes calldata _tx,
        dt.IncludedStorage[] calldata storageSlots
    ) external returns(bytes32[2] memory) {
        bytes32[2] memory outputs;
        return outputs;
    }

    /**
     * Return the tx type inferred by the length of bytes
     */
    function inferTxType(
        bytes memory _tx
    ) public view returns(uint) {
        if (_tx.length == 64) {
            return 0;
        }
        if (_tx.length == 256) {
            return 1;
        }
        if (_tx.length == 288) {
            return 2;
        }
        revert("Tx type not recognized!");
    }
}

    // /**
    //  * Helper function which checks if a given value fits in a uint8
    //  */
    // function isUint32(bytes32 value) private pure returns(bool) {
    //     // To check if something is a uint8 we will just check to see that
    //     // it has no values past the 8th byte. Note this checks "does this value fit in a uint8"
    //     // not if it was intended to be a uint8 or not
    //     bytes32 mask = 0x1111111111111111111111111111111111111111111111111111111100000000;
    //     bytes32 resultingValue = value & mask;
    //     return resultingValue == 0;
    // }



    // /*******************************
    //  * Transaction Execution Logic *
    //  ******************************/

    // /**
    //  * Mock the execution of a tx
    //  */
    // function mockExecuteTx(
    //     dt.SignedTx memory _signedTx,
    //     dt.StorageSlot[2] memory _storageSlots,
    // ) public returns(bytes32[3] memory) {
    //     bytes32[3] memory outputs = applyStoredAccountTransfer(_storageNonce, _storageSlots, _signedTx);
    //     // Check if we returned a fail
    //     if (outputs[2] == FAILED_TX_OUTPUT[2]) {
    //         halted = true;
    //     }
    //     // Return the output!
    //     return outputs;
    // }

    // function verifyEcdsaSignature(bytes memory _signature, address _pubkey) private pure returns(bool) {
    //     return true;
    // }

    // /**
    //  * Apply a transfer tx to an already stored storage slot
    //  */
    // function applyStoredAccountTransfer(
    //     uint _storageNonce,
    //     dt.StorageSlot[2] memory _storageSlots,
    //     dt.SignedTx memory _signedTx
    // ) public view returns(bytes32[3] memory) {
    //     // First decode the tx into a transfer tx
    //     dt.TransferTx memory transferTx = abi.decode(_signedTx.body, (dt.TransferTx));
    //     uint32 maxSendable = _storageSlots[0].value.balances[transferTx.tokenType];
    //     if (
    //         // Assert that the 1st storage slot matches the sender's signature
    //         !verifyEcdsaSignature(_signedTx.signature, _storageSlots[0].value.pubkey) ||
    //         // Assert that the 2nd storage slot matches the recipient
    //         transferTx.recipient != uint32(_storageSlots[1].slotIndex) ||
    //         // Assert that the sender can afford the transaction
    //         transferTx.amount > maxSendable
    //     ) {
    //         // If any of these checks fail, then return a failed tx output
    //         return FAILED_TX_OUTPUT;
    //     }
    //     // The tx seems to be valid, so let's update the balances
    //     _storageSlots[0].value.balances[transferTx.tokenType] -= transferTx.amount;
    //     _storageSlots[1].value.balances[transferTx.tokenType] += transferTx.amount;
    //     // Return the outputes -- the storage hashes & storage nonce
    //     bytes32[3] memory outputs;
    //     outputs[0] = getStorageHash(_storageSlots[0].value);
    //     outputs[1] = getStorageHash(_storageSlots[1].value);
    //     outputs[2] = bytes32(_storageNonce);
    //     return outputs;
    // }
