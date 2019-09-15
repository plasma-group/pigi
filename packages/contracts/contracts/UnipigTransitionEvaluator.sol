pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

/* Internal Imports */
import {DataTypes as dt} from "./DataTypes.sol";
import {TransitionEvaluator} from "./TransitionEvaluator.sol";

contract UnipigTransitionEvaluator is TransitionEvaluator {
    bytes32 ZERO_BYTES32 = 0x0000000000000000000000000000000000000000000000000000000000000000;
    address UNISWAP_ADDRESS = 0x0000000000000000000000000000000000000000;
    uint UNISWAP_FEE_IN_BIPS = 30;
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
    function inferTransitionType(
        bytes memory _transition
    ) public view returns(uint) {
        if (_transition.length == 352) {
            // Create account and Transfer
            return 0;
        }
        if (_transition.length == 320) {
            // Transfer
            return 1;
        }
        if (_transition.length == 384) {
            // Swap
            return 2;
        }
        revert("Tx type not recognized!");
    }

    /**
     * Apply a transfer stored account transaction
     */
    function applyTransferStoredAccountTx(
        dt.TransferTx memory _tx,
        dt.StorageSlot[2] memory _storageSlots
    ) public view returns(uint, dt.Storage[2] memory) {
        // First construct the transaction from the storage slots

        // Make sure that the provided storage slots are the correct ones
        require(verifyEcdsaSignature(_tx.signature, _storageSlots[0].value.pubkey), "Signer address must equal sender!");
        require(_tx.recipient == _storageSlots[1].slotIndex, "Storage slot must match the recipient!");
        // Create an array to store our output storage slots
        dt.Storage[2] memory outputStorage;
        // Now we know the pubkeys are correct, let's compute the output of the transaction
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
     * Apply a swap transaction
     */
    function applySwapTx(
        dt.SwapTx memory _tx,
        dt.StorageSlot[2] memory _storageSlots
    ) public view returns(uint, dt.Storage[2] memory) {
        // Make sure that the provided storage slots are the correct ones
        require(verifyEcdsaSignature(_tx.signature, _storageSlots[0].slotIndex), "Signer address must equal sender!");
        require(_storageSlots[1].slotIndex == UNISWAP_ADDRESS, "Storage slot must be uniswap's storage slot!");

        // Create an array to store our output storage slots
        dt.Storage[2] memory outputStorage;

        // Now we know the storage slots are correct, let's first make sure the sender has enough money to initiate the swap
        uint senderBalance = _storageSlots[0].value.balances[_tx.tokenType];
        // Make sure the sender has enough money
        if (senderBalance < _tx.inputAmount) {
            // If not we return a failed tx
            return (FAILED_TX, outputStorage);
        }

        // Store variables used for calculating the SWAP
        uint inputTokenType = _tx.tokenType;
        uint outputTokenType = 1 - _tx.tokenType;
        dt.Storage memory senderStorage = _storageSlots[0].value;
        dt.Storage memory uniswapStorage = _storageSlots[1].value;

        // Compute the SWAP
        uint invariant = uniswapStorage.balances[0] * uniswapStorage.balances[1];
        uint inputWithFee = _tx.inputAmount * (10000 - UNISWAP_FEE_IN_BIPS) / 10000;
        uint totalInput = inputWithFee + uniswapStorage.balances[inputTokenType];
        uint newOutputBalance = invariant / totalInput;
        uint32 outputAmount = uniswapStorage.balances[outputTokenType] - uint32(newOutputBalance);
        // Make sure the output amount is above the minimum
        if (outputAmount < _tx.minOutputAmount) {
            // If not we return a failed tx
            return (FAILED_TX, outputStorage);
        }

        // Update the sender storage slots with the new balances
        senderStorage.balances[inputTokenType] -= _tx.inputAmount;
        senderStorage.balances[outputTokenType] += outputAmount;
        // Update uniswap storage slots with the new balances
        uniswapStorage.balances[inputTokenType] += _tx.inputAmount;
        uniswapStorage.balances[outputTokenType] -= outputAmount;

        // Set our output storage
        outputStorage[0] = senderStorage;
        outputStorage[1] = uniswapStorage;
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
