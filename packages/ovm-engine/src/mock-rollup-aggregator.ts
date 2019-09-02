/* External Imports */
import { SimpleServer } from '@pigi/core'

/* Internal Imports */
import {
  Address,
  SignedTransaction,
  State,
  MockRollupStateMachine,
  Balances,
  UNISWAP_ADDRESS,
  UNI_TOKEN_TYPE,
  PIGI_TOKEN_TYPE,
  AGGREGATOR_ADDRESS,
  TokenType,
  generateTransferTx,
} from '.'

const generateFaucetTxs = (
  recipient: Address,
  amount: number
): [SignedTransaction, SignedTransaction] => {
  return [
    {
      signature: AGGREGATOR_ADDRESS,
      transaction: generateTransferTx(recipient, UNI_TOKEN_TYPE, amount),
    },
    {
      signature: AGGREGATOR_ADDRESS,
      transaction: generateTransferTx(recipient, PIGI_TOKEN_TYPE, amount),
    },
  ]
}

export class MockAggregator extends SimpleServer {
  public rollupStateMachine: MockRollupStateMachine

  constructor(genesisState: State, hostname: string, port: number) {
    const rollupStateMachine = new MockRollupStateMachine(genesisState)
    const methods = {
      // Get the balance for some account
      getBalances: (account: Address) =>
        rollupStateMachine.getBalances(account),
      // Get the balance for Uniswap
      getUniswapBalances: () => rollupStateMachine.getUniswapBalances(),
      // Apply a transaction
      applyTransaction: (transaction: SignedTransaction) =>
        rollupStateMachine.applyTransaction(transaction),
      // Request faucet funds
      requestFaucetFunds: (params: [Address, number]) => {
        const [recipient, amount] = params
        // Generate the faucet txs (one sending uni the other pigi)
        const faucetTxs = generateFaucetTxs(recipient, amount)
        // Apply the two txs
        rollupStateMachine.applyTransaction(faucetTxs[0])
        rollupStateMachine.applyTransaction(faucetTxs[1])
        // Return our new account balance
        return rollupStateMachine.getBalances(recipient)
      },
    }
    super(methods, hostname, port)
    this.rollupStateMachine = rollupStateMachine
  }
}
