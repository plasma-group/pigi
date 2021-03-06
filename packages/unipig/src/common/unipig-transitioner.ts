/* External Imports */
import {
  getLogger,
  logError,
  SignatureProvider,
  serializeObject,
  DefaultSignatureProvider,
  SimpleClient,
} from '@pigi/core-utils'

import {
  SignedByDBInterface,
  SignedByDB,
  SignedByDecider,
  MerkleInclusionProofDecider,
} from '@pigi/ovm'

import { DB } from '@pigi/core-db'

/* Internal Imports */
import {
  Address,
  Balances,
  FaucetRequest,
  isFaucetTransaction,
  RollupStateSolver,
  RollupTransaction,
  SignatureError,
  SignedStateReceipt,
  StateReceipt,
  Swap,
  TokenType,
  Transfer,
} from '../types'
import { DefaultRollupStateSolver } from './rollup-state-solver'
import { RollupClient } from './rollup-client'
import { EMPTY_AGGREGATOR_SIGNATURE, UNISWAP_ADDRESS } from './utils'

const log = getLogger('unipig-transitioner')

interface KnownState {
  [pubKey: string]: StateReceipt
}

/*
 * The UnipigTransitioner class can be used to interact with the OVM and
 * all the L2s under it.
 */
export class UnipigTransitioner {
  private knownState: KnownState

  public static async new(
    db: DB,
    aggregatorAddress: Address,
    signatureProvider?: SignatureProvider,
    aggregatorURL: string = 'http://127.0.0.1:3000'
  ): Promise<UnipigTransitioner> {
    if (!signatureProvider) {
      signatureProvider = new DefaultSignatureProvider()
    }
    const signedByDB: SignedByDBInterface = new SignedByDB(db)
    const decider: SignedByDecider = new SignedByDecider(
      signedByDB,
      await signatureProvider.getAddress()
    )
    const stateSolver: RollupStateSolver = new DefaultRollupStateSolver(
      signedByDB,
      decider,
      new MerkleInclusionProofDecider()
    )
    const rollupclient: RollupClient = new RollupClient(db, aggregatorAddress)
    rollupclient.connect(new SimpleClient(aggregatorURL))

    return new UnipigTransitioner(
      db,
      stateSolver,
      rollupclient,
      signatureProvider,
      aggregatorAddress
    )
  }

  constructor(
    private readonly db: DB,
    private readonly stateSolver: RollupStateSolver,
    private readonly rollupClient: RollupClient,
    private readonly signatureProvider: SignatureProvider,
    private readonly aggregatorAddress: Address
  ) {
    this.knownState = {}
  }

  public async sign(message: string): Promise<string> {
    log.debug('Address:', await this.getAddress(), 'signing message:', message)
    return this.signatureProvider.sign(message)
  }

  public async getAddress(): Promise<string> {
    return this.signatureProvider.getAddress()
  }

  public async getUniswapBalances(): Promise<Balances> {
    return this.getBalances(UNISWAP_ADDRESS)
  }

  public async getUniswapState(): Promise<StateReceipt> {
    return this.getState(UNISWAP_ADDRESS)
  }

  public async getBalances(account: Address): Promise<Balances> {
    const stateReceipt: StateReceipt = await this.getState(account)
    return !!stateReceipt && !!stateReceipt.state
      ? stateReceipt.state.balances
      : undefined
  }

  public async getState(account: Address): Promise<StateReceipt> {
    log.debug(`Fetching state for ${account}`)

    // For now we only have one client so just get the rollup balance
    const signedState: SignedStateReceipt = await this.rollupClient.getState(
      account
    )

    log.debug(
      `State for ${account}: ${JSON.stringify(signedState.stateReceipt)}`
    )

    if (signedState.signature === EMPTY_AGGREGATOR_SIGNATURE) {
      return signedState.stateReceipt
    }

    log.debug(
      `Storing state for ${account}: ${JSON.stringify(
        signedState.stateReceipt
      )}`
    )

    await this.stateSolver.storeSignedStateReceipt(signedState)
    // TODO: commenting this out until we figure out how to support Buffers in the browser
    // If valid, update known state
    // if (
    //   (account in this.knownState &&
    //     signedState.signature === EMPTY_AGGREGATOR_SIGNATURE) ||
    //   (await this.stateSolver.isStateReceiptProvablyValid(
    //     signedState.stateReceipt,
    //     aggregatorAddress
    //   ))
    // ) {
    this.knownState[account] = signedState.stateReceipt
    // }

    return account in this.knownState ? this.knownState[account] : undefined
  }

  public async send(
    tokenType: TokenType,
    to: Address,
    amount: number
  ): Promise<void> {
    const transaction: Transfer = {
      sender: await this.getAddress(),
      recipient: to,
      tokenType,
      amount,
    }
    await this.submitTransaction(transaction)
  }

  public async swap(
    tokenType: TokenType,
    inputAmount: number,
    minOutputAmount: number,
    timeoutMillis: number
  ): Promise<void> {
    const transaction: Swap = {
      sender: await this.getAddress(),
      tokenType,
      inputAmount,
      minOutputAmount,
      timeout: timeoutMillis,
    }
    await this.submitTransaction(transaction)
  }

  public async requestFaucetFunds(amount: number = 10): Promise<void> {
    const faucetRequest: FaucetRequest = {
      sender: await this.getAddress(),
      amount,
    }
    await this.submitTransaction(faucetRequest)
  }

  private async submitTransaction(
    transaction: RollupTransaction
  ): Promise<void> {
    let receipts: SignedStateReceipt[] = []
    try {
      if (isFaucetTransaction(transaction)) {
        receipts = [
          await this.rollupClient.requestFaucetFunds(
            transaction,
            this.signatureProvider
          ),
        ]
      } else {
        receipts = await this.rollupClient.sendTransaction(
          transaction,
          this.signatureProvider
        )
      }
    } catch (e) {
      if (e instanceof SignatureError) {
        logError(
          log,
          `Transaction was sent and a response was received, indicating it probably went through, but the signature on the response was invalid, so we cannot be sure. Tx: ${serializeObject(
            transaction
          )}`,
          e
        )
      } else {
        logError(
          log,
          `An error occurred sending transaction: Tx: ${serializeObject(
            transaction
          )}.`,
          e
        )
      }
      throw e
    }

    try {
      await Promise.all(
        receipts.map((r) => this.stateSolver.storeSignedStateReceipt(r))
      )
    } catch (e) {
      logError(
        log,
        `An error persisting transaction receipt for Tx: ${serializeObject(
          transaction
        )}.`,
        e
      )
    }
  }
}
