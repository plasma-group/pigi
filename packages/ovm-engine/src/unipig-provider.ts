/* External Imports */
import { DefaultWallet, BigNumber, abi } from '@pigi/core'

/* Internal Imports */
import { Address, Balances, Swap, Transfer } from '.'

/*
 * The UnipigProvider class includes a number of functions
 * which are specially built for uniswap. Additionally, this
 * class is MOCKED and does not actually communicate with an aggregator.
 */
export class UnipigProvider {
  public async getBalances(account: Address): Promise<Balances> {
    // return some sample balances
    return {
      uni: new BigNumber(10),
      pigi: new BigNumber(15),
    }
  }

  public getSwapTransaction(swap: Swap) {
    return abi.encode(
      ['boolean', 'uint', 'uint', 'uint'],
      [swap.tokenType, swap.inputAmount, swap.minOutputAmount, swap.timeout]
    )
  }

  public getTransferTransaction(transfer: Transfer) {
    return abi.encode(
      ['boolean', 'address', 'uint', 'uint'],
      [transfer.tokenType, transfer.recipient, transfer.amount]
    )
  }

  public async sendSignedTransaction(transaction: string) {
    // TODO
  }
}
