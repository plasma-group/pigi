/* External Imports */
import * as AsyncLock from 'async-lock'
import { Contract, ethers } from 'ethers'

import {
  SignatureVerifier,
  DefaultSignatureVerifier,
  serializeObject,
  DefaultSignatureProvider,
  DB,
  getLogger,
  hexStrToBuf,
  SignatureProvider,
} from '@pigi/core'
import { EthereumListener, Event } from '@pigi/watch-eth'

/* Internal Imports */
import {
  Address,
  SignedTransaction,
  UNI_TOKEN_TYPE,
  PIGI_TOKEN_TYPE,
  generateTransferTx,
  RollupTransaction,
  UNISWAP_ADDRESS,
  RollupTransition,
  StateUpdate,
  RollupBlock,
  SignedStateReceipt,
  StateSnapshot,
  Signature,
  StateReceipt,
  abiEncodeStateReceipt,
  isSwapTransaction,
  Transfer,
  abiEncodeTransition,
  TransferTransition,
  abiEncodeTransaction,
  EMPTY_AGGREGATOR_SIGNATURE,
  isFaucetTransaction,
  NotSyncedError,
} from '../index'
import { RollupStateMachine } from '../types'
import { UnipigAggregator } from '../types/unipig-aggregator'

const log = getLogger('rollup-aggregator')

/*
 * An aggregator implementation which allows for transfers, swaps,
 * balance queries, & faucet requests.
 */
export class RollupAggregator
  implements EthereumListener<Event>, UnipigAggregator {
  private static readonly lockKey: string = 'lock'

  private readonly db: DB
  private readonly lock: AsyncLock
  private readonly wallet: ethers.Wallet
  private readonly rollupStateMachine: RollupStateMachine
  private readonly signatureProvider: SignatureProvider
  private readonly signatureVerifier: SignatureVerifier
  private readonly rollupContract: Contract

  private synced: boolean
  private blockNumber: number
  private transitionIndex: number
  private pendingBlock: RollupBlock

  constructor(
    db: DB,
    rollupStateMachine: RollupStateMachine,
    mnemonic: string,
    rollupContract: Contract,
    signatureVerifier: SignatureVerifier = DefaultSignatureVerifier.instance()
  ) {
    this.rollupStateMachine = rollupStateMachine
    this.wallet = ethers.Wallet.fromMnemonic(mnemonic)
    this.signatureVerifier = signatureVerifier
    this.signatureProvider = new DefaultSignatureProvider(this.wallet)
    this.db = db
    this.transitionIndex = 0
    this.blockNumber = 1
    this.pendingBlock = {
      number: this.blockNumber,
      transitions: [],
    }
    this.lock = new AsyncLock()

    this.rollupContract = rollupContract
    this.synced = false
  }

  public async onSyncCompleted(syncIdentifier?: string): Promise<void> {
    this.synced = true
  }

  public async handle(event: Event): Promise<void> {
    // TODO: handle events
    // Two categories:
    // 1) I submitted this block, and this is just a confirm
    // 2) Someone else submitted this block, and I need to get up to speed.
  }

  public async getState(address: string): Promise<SignedStateReceipt> {
    if (!this.synced) {
      throw new NotSyncedError()
    }

    try {
      const stateReceipt: StateReceipt = await this.lock.acquire(
        RollupAggregator.lockKey,
        async () => {
          const snapshot: StateSnapshot = await this.rollupStateMachine.getState(
            address
          )
          return {
            blockNumber: this.blockNumber,
            transitionIndex: this.transitionIndex,
            ...snapshot,
          }
        }
      )
      let signature: Signature
      if (!!stateReceipt.state) {
        signature = await this.signatureProvider.sign(
          abiEncodeStateReceipt(stateReceipt)
        )
      } else {
        signature = EMPTY_AGGREGATOR_SIGNATURE
      }

      return {
        stateReceipt,
        signature,
      }
    } catch (e) {
      log.error(
        `Error getting state for address [${address}]! ${e.message}, ${e.stack}`
      )
      throw e
    }
  }

  public async applyTransaction(
    signedTransaction: SignedTransaction
  ): Promise<SignedStateReceipt[]> {
    if (!this.synced) {
      throw new NotSyncedError()
    }

    try {
      const [
        stateUpdate,
        blockNumber,
        transitionIndex,
      ] = await this.lock.acquire(RollupAggregator.lockKey, async () => {
        const update: StateUpdate = await this.rollupStateMachine.applyTransaction(
          signedTransaction
        )
        await this.addToPendingBlock([update], signedTransaction)
        return [update, this.blockNumber, this.transitionIndex]
      })

      return this.respond(stateUpdate, blockNumber, transitionIndex)
    } catch (e) {
      log.error(
        `Error applying transaction [${serializeObject(signedTransaction)}]! ${
          e.message
        }, ${e.stack}`
      )
      throw e
    }
  }

  public async requestFaucetFunds(
    signedTransaction: SignedTransaction
  ): Promise<SignedStateReceipt> {
    if (!this.synced) {
      throw new NotSyncedError()
    }

    try {
      if (!isFaucetTransaction(signedTransaction.transaction)) {
        throw Error('Cannot handle non-Faucet Request in faucet endpoint')
      }
      const messageSigner: Address = this.signatureVerifier.verifyMessage(
        serializeObject(signedTransaction.transaction),
        signedTransaction.signature
      )
      if (messageSigner !== signedTransaction.transaction.sender) {
        throw Error(
          `Faucet requests must be signed by the request address. Signer address: ${messageSigner}, sender: ${signedTransaction.transaction.sender}`
        )
      }

      // TODO: Probably need to check amount before blindly giving them this amount

      const { sender, amount } = signedTransaction.transaction
      // Generate the faucet txs (one sending uni the other pigi)
      const faucetTxs = await this.generateFaucetTxs(
        sender, // original tx sender... is actually faucet fund recipient
        amount
      )

      const [
        stateUpdate,
        blockNumber,
        transitionIndex,
      ] = await this.lock.acquire(RollupAggregator.lockKey, async () => {
        // Apply the two txs
        const updates: StateUpdate[] = await this.rollupStateMachine.applyTransactions(
          faucetTxs
        )

        await this.addToPendingBlock(updates, signedTransaction)
        return [
          updates[updates.length - 1],
          this.blockNumber,
          this.transitionIndex,
        ]
      })

      return (await this.respond(stateUpdate, blockNumber, transitionIndex))[1]
    } catch (e) {
      log.error(
        `Error handling faucet request [${serializeObject(
          signedTransaction
        )}]! ${e.message}, ${e.stack}`
      )
      throw e
    }
  }

  /**
   * Responds to the provided RollupTransaction according to the provided resulting state
   * update and rollup transition.
   *
   * @param stateUpdate The state update that resulted from this transaction
   * @param blockNumber The block number of this update
   * @param transitionIndex The transition index of this update
   * @returns The signed state receipt objects for the
   */
  private async respond(
    stateUpdate: StateUpdate,
    blockNumber: number,
    transitionIndex: number
  ): Promise<SignedStateReceipt[]> {
    const receipts: SignedStateReceipt[] = []

    const senderReceipt: StateReceipt = {
      slotIndex: stateUpdate.senderSlotIndex,
      stateRoot: stateUpdate.stateRoot,
      state: stateUpdate.senderState,
      inclusionProof: stateUpdate.senderStateInclusionProof,
      blockNumber,
      transitionIndex,
    }
    const senderSignature: string = await this.signatureProvider.sign(
      abiEncodeStateReceipt(senderReceipt)
    )
    receipts.push({
      signature: senderSignature,
      stateReceipt: senderReceipt,
    })

    if (stateUpdate.receiverState.pubKey !== UNISWAP_ADDRESS) {
      const recipientReceipt: StateReceipt = {
        slotIndex: stateUpdate.receiverSlotIndex,
        stateRoot: stateUpdate.stateRoot,
        state: stateUpdate.receiverState,
        inclusionProof: stateUpdate.receiverStateInclusionProof,
        blockNumber,
        transitionIndex,
      }
      const recipientSignature: string = await this.signatureProvider.sign(
        abiEncodeStateReceipt(recipientReceipt)
      )
      receipts.push({
        signature: recipientSignature,
        stateReceipt: recipientReceipt,
      })
    }

    log.debug(`Returning receipts: ${serializeObject(receipts)}`)
    return receipts
  }

  /**
   * Adds and returns the pending transition(s) resulting from
   * the provided StateUpdate(s).
   *
   * @param updates The state updates in question
   * @param transaction The signed transaction received as input
   * @returns The rollup transition
   */
  private async addToPendingBlock(
    updates: StateUpdate[],
    transaction: SignedTransaction
  ): Promise<RollupTransition[]> {
    const transitions: RollupTransition[] = []

    if (isSwapTransaction(transaction.transaction)) {
      const update: StateUpdate = updates[0]
      transitions.push({
        stateRoot: update.stateRoot,
        senderSlotIndex: update.senderSlotIndex,
        uniswapSlotIndex: update.receiverSlotIndex,
        tokenType: transaction.transaction.tokenType,
        inputAmount: transaction.transaction.inputAmount,
        minOutputAmount: transaction.transaction.minOutputAmount,
        timeout: transaction.transaction.timeout,
        signature: transaction.signature,
      })
    } else {
      // It's a transfer -- either faucet or p2p
      for (const u of updates) {
        transitions.push(this.getTransferTransitionFromStateUpdate(u))
      }
    }

    for (const trans of transitions) {
      await this.db
        .bucket(this.getDBKeyFromNumber(this.pendingBlock.number))
        .put(
          this.getDBKeyFromNumber(++this.transitionIndex),
          hexStrToBuf(abiEncodeTransition(trans))
        )
    }

    return transitions
  }

  /**
   * Creates a TransferTransition from the provided StateUpdate for a Transfer.
   * @param update The state update
   * @returns the TransferTransition
   */
  private getTransferTransitionFromStateUpdate(
    update: StateUpdate
  ): TransferTransition {
    const transfer = update.transaction.transaction as Transfer
    const transition = {
      stateRoot: update.stateRoot,
      senderSlotIndex: update.senderSlotIndex,
      recipientSlotIndex: update.receiverSlotIndex,
      tokenType: transfer.tokenType,
      amount: transfer.amount,
      signature: update.transaction.signature,
    }
    if (update.receiverCreated) {
      transition['createdAccountPubkey'] = update.receiverState.pubKey
    }
    return transition
  }
  /**
   * Submits a block to the main chain, creating a new pending block for future
   * transitions.
   */
  private async submitBlock(): Promise<void> {
    return this.lock.acquire(RollupAggregator.lockKey, async () => {
      const toSubmit = this.pendingBlock

      // TODO: submit block here

      this.pendingBlock = {
        number: ++this.blockNumber,
        transitions: [],
      }
      this.transitionIndex = 0
    })
  }

  private getDBKeyFromNumber(num: number): Buffer {
    const buff = Buffer.alloc(4)
    buff.writeUInt32BE(num, 0)
    return buff
  }

  /**
   * Generates two transactions which together send the user some UNI
   * & some PIGI.
   *
   * @param recipient The address to receive the faucet tokens
   * @param amount The amount to receive
   * @returns The signed faucet transactions
   */
  private async generateFaucetTxs(
    recipient: Address,
    amount: number
  ): Promise<SignedTransaction[]> {
    const address: string = await this.signatureProvider.getAddress()
    const txOne: RollupTransaction = generateTransferTx(
      address,
      recipient,
      UNI_TOKEN_TYPE,
      amount
    )
    const txTwo: RollupTransaction = generateTransferTx(
      address,
      recipient,
      PIGI_TOKEN_TYPE,
      amount
    )

    return [
      {
        signature: await this.signatureProvider.sign(
          abiEncodeTransaction(txOne)
        ),
        transaction: txOne,
      },
      {
        signature: await this.signatureProvider.sign(
          abiEncodeTransaction(txTwo)
        ),
        transaction: txTwo,
      },
    ]
  }
}
