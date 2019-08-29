import { DefaultWallet, BigNumber, abi } from '@pigi/core'

type UNI = 0
type PIGI = 1

type SUCCESS = 'SUCCESS'
type FAILURE = 'FAILURE'

type Address = string

interface Balances {
  uni: BigNumber
  pigi: BigNumber
}

interface Swap {
  tokenType: UNI | PIGI
  inputAmount: BigNumber
  minOutputAmount: BigNumber
  timeout: number
}

interface Transfer {
  tokenType: UNI | PIGI
  recipient: BigNumber
  amount: BigNumber
}

interface TransactionReceipt {
  status: SUCCESS | FAILURE
  newBalances: Balances
}

/*
 * The MockUniswapWallet class includes a number of functions
 * which are specially built for uniswap. Additionally, this
 * class is MOCKED and does not actually communicate with an aggregator.
 */
export class OVMUnipig {
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
  }
}
