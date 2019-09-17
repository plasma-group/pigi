import './setup'

/* External Imports */
import { SignedTransaction, Swap, Transaction, Transfer } from '../src/types'
import {
  abiEncodeSignedTransaction,
  abiEncodeTransaction,
  parseSignedTransactionFromABI,
  parseTransactionFromABI,
} from '../src/serialization'

/* Internal Imports */

describe('RollupEncoding', () => {
  it('should encoded & decode AbiTransferTx without throwing', async () => {
    const address = '0x' + '31'.repeat(20)
    const tx: Transfer = {
      sender: address,
      recipient: address,
      tokenType: 1,
      amount: 15,
    }

    const abiEncoded: string = abiEncodeTransaction(tx)
    const transfer: Transaction = parseTransactionFromABI(abiEncoded)

    transfer.should.deep.equal(tx)
  })

  it('should encoded & decode AbiSwapTx without throwing', async () => {
    const address = '0x' + '31'.repeat(20)
    const tx: Swap = {
      sender: address,
      tokenType: 1,
      inputAmount: 15,
      minOutputAmount: 4,
      timeout: +new Date(),
    }

    const abiEncoded: string = abiEncodeTransaction(tx)
    const swap: Transaction = parseTransactionFromABI(abiEncoded)

    swap.should.deep.equal(tx)
  })

  it('should encoded & decode AbiSignedTx without throwing', async () => {
    const address = '0x' + '31'.repeat(20)
    const transfer: Transfer = {
      sender: address,
      recipient: address,
      tokenType: 1,
      amount: 15,
    }
    const signedTransfer: SignedTransaction = {
      signature: '0x1234',
      transaction: transfer,
    }

    const swap: Swap = {
      sender: address,
      tokenType: 1,
      inputAmount: 15,
      minOutputAmount: 4,
      timeout: +new Date(),
    }
    const signedSwap: SignedTransaction = {
      signature: '0x4321',
      transaction: swap,
    }

    const abiEncodedSwap: string = abiEncodeSignedTransaction(signedSwap)
    const abiEncodedTransfer: string = abiEncodeSignedTransaction(
      signedTransfer
    )
    abiEncodedSwap.should.not.equal(abiEncodedTransfer)

    const parsedSwap: SignedTransaction = parseSignedTransactionFromABI(
      abiEncodedSwap
    )
    const parsedTransfer: SignedTransaction = parseSignedTransactionFromABI(
      abiEncodedTransfer
    )
    parsedSwap.should.not.deep.equal(parsedTransfer)

    parsedSwap.should.deep.equal(signedSwap)
    parsedTransfer.should.deep.equal(signedTransfer)
  })
})
