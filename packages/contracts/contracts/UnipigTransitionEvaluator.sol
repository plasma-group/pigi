pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* Internal Imports */
import {DataTypes as dt} from "./DataTypes.sol";
import {TransitionEvaluator} from "./TransitionEvaluator.sol";

contract UnipigTransitionEvaluator is TransitionEvaluator {
    bytes32 ZERO_BYTES32 = 0x0000000000000000000000000000000000000000000000000000000000000000;
    uint FAILED_TX = 0;
    uint SUCCESSFUL_TX = 1;

    function evaluateTransition(
        bytes calldata _tx,
        dt.StorageSlot[] calldata _storageSlots
    ) external returns(bytes32[2] memory) {
        bytes32[2] memory outputs;
        return outputs;
    }

    function verifyEcdsaSignature(bytes memory _signature, address _pubkey) private pure returns(bool) {
        return true;
    }

    /**
     * Return the tx type inferred by the length of bytes
     */
    function inferTxType(
        bytes memory _tx
    ) public view returns(uint) {
        if (_tx.length == 256) {
            return 0;
        }
        if (_tx.length == 288) {
            return 1;
        }
        revert("Tx type not recognized!");
    }

    /**
     * Apply a transaction which creates a new storage slot
     */
    function applyTransferTx(
        dt.TransferTx memory _tx,
        dt.StorageSlot[2] memory _storageSlots
    ) public view returns(uint, dt.Storage[2] memory) {
        // Make sure that the provided storage slots are the correct ones
        require(verifyEcdsaSignature(_tx.signature, _storageSlots[0].slotIndex), "Signer address must equal sender!");
        require(_tx.recipient == _storageSlots[1].slotIndex, "Storage slot must match the recipient!");
        // Create an array to store our output storage slots
        dt.Storage[2] memory outputStorage;
        // Now we know the storage slots are correct, let's compute the output of the transaction
        uint senderBalance = _storageSlots[0].value.balances[_tx.tokenType];
        // First let's make sure the sender has enough money
        if (senderBalance < _tx.amount) {
            // If not we return a failed tx
            return (FAILED_TX, outputStorage);
        }
        // Update the storage slots with the new balances
        _storageSlots[0].value.balances[_tx.tokenType] -= _tx.amount;
        _storageSlots[1].value.balances[_tx.tokenType] += _tx.amount;
        // Calculate the outputs
        outputStorage[0] = _storageSlots[0].value;
        outputStorage[1] = _storageSlots[1].value;
        // Return the outputs!
        return (SUCCESSFUL_TX, outputStorage);
    }

    /**
     * Get the hash of the storage value.
     */
    function getStorageHash(dt.Storage memory _storage) public pure returns(bytes32) {
        // Here we don't use `abi.encode([struct])` because it's not clear
        // how to generate that encoding client-side.
        return keccak256(abi.encode(_storage.balances[0], _storage.balances[1]));
    }
}
