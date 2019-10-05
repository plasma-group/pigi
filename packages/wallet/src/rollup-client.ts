/* External Imports */
import {
  DefaultSignatureVerifier,
  getLogger,
  KeyValueStore,
  RpcClient,
  serializeObject,
  SignatureProvider,
  SignatureVerifier,
} from '@pigi/core'

/* Internal Imports */
import {
  Address,
  RollupTransaction,
  UNISWAP_ADDRESS,
  AGGREGATOR_API,
  SignedStateReceipt,
  abiEncodeTransaction,
  SignatureError,
  abiEncodeStateReceipt,
  EMPTY_AGGREGATOR_SIGNATURE,
  NON_EXISTENT_SLOT_INDEX,
} from './index'

const log = getLogger('rollup-client')

/**
 * Simple Rollup Client enabling getting balances & sending transactions.
 */
export class RollupClient {
  public rpcClient: RpcClient

  /**
   * Initializes the RollupClient
   * @param db the KeyValueStore used by the Rollup Client. Note this is mocked
   *           and so we don't currently use the DB.
   * @param aggregatorAddress The address of the aggregator with which this client interacts
   * @param signatureVerifier The signature verifier for this client, able to verify
   * response signatures
   */
  constructor(
    private readonly db: KeyValueStore,
    private readonly aggregatorAddress: Address,
    private readonly signatureVerifier: SignatureVerifier = DefaultSignatureVerifier.instance()
  ) {}

  /**
   * Connects to an aggregator using a provided rpcClient
   * @param rpcClient the rpcClient to use -- normally it's a SimpleClient
   */
  public connect(rpcClient: RpcClient) {
    // Create a new simple JSON rpc server for the rollup client
    this.rpcClient = rpcClient
    // TODO: Persist the aggregator url
  }

  /**
   * Gets the state for the provided account.
   * @param account the account whose state will be retrieved.
   * @returns the SignedStateReceipt for the account
   */
  public async getState(account: Address): Promise<SignedStateReceipt> {
    const receipt: SignedStateReceipt = await this.rpcClient.handle<
      SignedStateReceipt
    >(AGGREGATOR_API.getState, account)
    this.verifyTransactionReceipt(receipt)
    return receipt
  }

  public async sendTransaction(
    transaction: RollupTransaction,
    signatureProvider: SignatureProvider
  ): Promise<SignedStateReceipt[]> {
    const signature = await signatureProvider.sign(
      abiEncodeTransaction(transaction)
    )
    const receipts: SignedStateReceipt[] = await this.rpcClient.handle<
      SignedStateReceipt[]
    >(AGGREGATOR_API.applyTransaction, {
      signature,
      transaction,
    })

    for (const receipt of receipts) {
      this.verifyTransactionReceipt(receipt)
    }

    return receipts
  }

  public async requestFaucetFunds(
    transaction: RollupTransaction,
    signatureProvider: SignatureProvider
  ): Promise<SignedStateReceipt> {
    const signature = await signatureProvider.sign(serializeObject(transaction))
    const receipt: SignedStateReceipt = await this.rpcClient.handle<
      SignedStateReceipt
    >(AGGREGATOR_API.requestFaucetFunds, {
      signature,
      transaction,
    })
    this.verifyTransactionReceipt(receipt)
    return receipt
  }

  private verifyTransactionReceipt(receipt: SignedStateReceipt): void {
    if (
      receipt.signature === EMPTY_AGGREGATOR_SIGNATURE &&
      receipt.stateReceipt.slotIndex === NON_EXISTENT_SLOT_INDEX
    ) {
      return
    }

    const signer = this.signatureVerifier.verifyMessage(
      abiEncodeStateReceipt(receipt.stateReceipt),
      receipt.signature
    )
    if (signer !== this.aggregatorAddress) {
      log.error(
        `Received invalid SignedStateReceipt from the Aggregator: ${serializeObject(
          receipt
        )}`
      )
      throw new SignatureError()
    }
  }
}
