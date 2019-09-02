/* External Imports */
import { KeyValueStore, RpcClient, serializeObject } from '@pigi/core'

/* Internal Imports */
import {
  Address,
  Balances,
  Transaction,
  MockedSignature,
  TransactionReceipt,
  UNISWAP_ADDRESS,
} from '.'

export class MockRollupClient {
  public rpcClient: RpcClient
  public uniswapAddress: Address

  constructor(
    readonly db: KeyValueStore,
    readonly sign: (address: string, message: string) => Promise<string>
  ) {}

  public connect(rpcClient: RpcClient) {
    // Create a new simple JSON rpc server for the rollup client
    this.rpcClient = rpcClient
    // TODO: Persist the aggregator url
  }

  public async getBalances(account: Address): Promise<Balances> {
    const balances = await this.rpcClient.handle<Balances>(
      'getBalances',
      account
    )
    return balances
  }

  public async getUniswapBalances(): Promise<Balances> {
    return this.getBalances(UNISWAP_ADDRESS)
  }

  public async sendTransaction(
    transaction: Transaction,
    account: Address
  ): Promise<Balances> {
    const signature = await this.sign(account, serializeObject(transaction))
    const result = await this.rpcClient.handle<TransactionReceipt>(
      'applyTransaction',
      {
        signature,
        transaction,
      }
    )
    return result.stateUpdate
  }

  private ecdsaRecover(signature: MockedSignature): Address {
    // TODO: Move this out of this class and instead put in keystore
    return signature
  }
}
