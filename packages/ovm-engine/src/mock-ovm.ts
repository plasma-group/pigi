/* External Imports */
import { BigNumber, abi } from '@pigi/core'

/* Internal Imports */
import { Address, Balances, Swap, Transfer, Storage } from '.'

export class MockRollupState {
  public accounts: { Address: Storage }
  public uniswapAddress: Address
}
