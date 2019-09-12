/* External Imports */
import {
  SignatureVerifier,
  DefaultSignatureVerifier,
  SimpleServer,
  serializeObject,
  DefaultSignatureProvider,
  DB,
  objectToBuffer,
} from '@pigi/core'

/* Internal Imports */
import {
  Address,
  SignedTransaction,
  State,
  Balances,
  TransactionReceipt,
  UNI_TOKEN_TYPE,
  PIGI_TOKEN_TYPE,
  generateTransferTx,
  AGGREGATOR_API,
  Transaction,
  SignatureProvider,
  UNISWAP_ADDRESS,
  AGGREGATOR_ADDRESS,
  RollupBlock,
  StateUpdate,
  SignedTransactionReceipt,
} from '../index'
import { ethers } from 'ethers'
import { RollupStateMachine } from '../types'

/*
 * Generate two transactions which together send the user some UNI
 * & some PIGI
 */
const generateFaucetTxs = async (
  recipient: Address,
  amount: number,
  aggregatorAddress: string = AGGREGATOR_ADDRESS,
  signatureProvider?: SignatureProvider
): Promise<SignedTransaction[]> => {
  const txOne: Transaction = generateTransferTx(
    recipient,
    UNI_TOKEN_TYPE,
    amount
  )
  const txTwo: Transaction = generateTransferTx(
    recipient,
    PIGI_TOKEN_TYPE,
    amount
  )

  return [
    {
      signature: await signatureProvider.sign(
        aggregatorAddress,
        serializeObject(txOne)
      ),
      transaction: txOne,
    },
    {
      signature: await signatureProvider.sign(
        aggregatorAddress,
        serializeObject(txTwo)
      ),
      transaction: txTwo,
    },
  ]
}

/*
 * A mock aggregator implementation which allows for transfers, swaps,
 * balance queries, & faucet requests
 */
export class MockAggregator extends SimpleServer {
  private readonly db: DB
  private blockNumber: number
  private readonly pendingRollupBlocks: RollupBlock[]
  private readonly rollupStateMachine: RollupStateMachine
  private readonly signatureProvider: SignatureProvider

  constructor(
    db: DB,
    rollupStateMachine: RollupStateMachine,
    hostname: string,
    port: number,
    mnemonic: string,
    signatureVerifier: SignatureVerifier = DefaultSignatureVerifier.instance(),
    middleware?: Function[]
  ) {
    const wallet: ethers.Wallet = ethers.Wallet.fromMnemonic(mnemonic)
    const signatureProvider: SignatureProvider = new DefaultSignatureProvider(
      wallet
    )

    // REST API for our aggregator
    const methods = {
      /*
       * Get balances for some account
       */
      [AGGREGATOR_API.getBalances]: async (
        account: Address
      ): Promise<Balances> => rollupStateMachine.getBalances(account),

      /*
       * Get balances for Uniswap
       */
      [AGGREGATOR_API.getUniswapBalances]: async (): Promise<Balances> =>
        rollupStateMachine.getBalances(UNISWAP_ADDRESS),

      /*
       * Apply either a transfer or swap transaction
       */
      [AGGREGATOR_API.applyTransaction]: async (
        transaction: SignedTransaction
      ): Promise<SignedTransactionReceipt> => {
        const stateUpdate: StateUpdate = await rollupStateMachine.applyTransaction(
          transaction
        )

        return this.respond(stateUpdate, transaction)
      },

      /*
       * Request money from a faucet
       */
      [AGGREGATOR_API.requestFaucetFunds]: async (
        params: [Address, number]
      ): Promise<SignedTransactionReceipt> => {
        const [recipient, amount] = params
        // Generate the faucet txs (one sending uni the other pigi)
        const faucetTxs = await generateFaucetTxs(
          recipient,
          amount,
          wallet.address,
          signatureProvider
        )
        // Apply the two txs
        const stateUpdate: StateUpdate = await rollupStateMachine.applyTransactions(
          faucetTxs
        )

        //TODO: I'm sure this will be initiated by a signed transaction
        // When the signature gets updated to reflect that, pass it to respond(...)
        return this.respond(stateUpdate, undefined)
      },
    }
    super(methods, hostname, port, middleware)
    this.rollupStateMachine = rollupStateMachine
    this.signatureProvider = signatureProvider
    this.db = db
    this.blockNumber = 1
    this.pendingRollupBlocks = []
  }

  /**
   * Creates a pending block for the provided StateUpdate and responds to the
   * provided Transaction accordingly.
   *
   * @param stateUpdate The state update that resulted from this transaction
   * @param transaction The transaction
   * @returns The signed transaction response
   */
  private async respond(
    stateUpdate: StateUpdate,
    transaction: SignedTransaction
  ): Promise<SignedTransactionReceipt> {
    const block: RollupBlock = await this.addToPendingBlock(
      stateUpdate,
      transaction
    )

    const transactionReceipt: TransactionReceipt = {
      blockNumber: block.number,
      transactionIndex: 0, //TODO: change when we allow multiple per block
      transaction,
      startRoot: block.startRoot,
      endRoot: block.endRoot,
      updatedState: stateUpdate.updatedState,
      updatedStateInclusionProof: stateUpdate.updatedStateInclusionProof,
    }

    const aggregatorSignature: string = await this.signatureProvider.sign(
      AGGREGATOR_ADDRESS,
      serializeObject(transactionReceipt)
    )
    return {
      aggregatorSignature,
      ...transactionReceipt,
    }
  }

  /**
   * Adds and returns the pending block resulting from the provided StateUpdate.
   *
   * @param update The state update in question
   * @param transaction The signed transaction received as input
   * @returns The rollup block
   */
  private async addToPendingBlock(
    update: StateUpdate,
    transaction: SignedTransaction
  ): Promise<RollupBlock> {
    //TODO: Since it's async, blocks might not be in order of startRoot / endRoot
    // do we want to enforce that?
    const rollupBlock: RollupBlock = {
      number: this.blockNumber++,
      transactions: [transaction],
      startRoot: update.startRoot,
      endRoot: update.endRoot,
    }

    await this.db.put(
      this.getBlockKey(rollupBlock.number),
      objectToBuffer(rollupBlock)
    )

    return rollupBlock
  }

  private getBlockKey(blockNum: number): Buffer {
    const buff = Buffer.alloc(256)
    buff.writeUInt32BE(blockNum, 0)
    return buff
  }
}
