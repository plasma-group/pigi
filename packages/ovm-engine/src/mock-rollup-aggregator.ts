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
} from '../src'

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
    }
    super(methods, hostname, port)
    this.rollupStateMachine = rollupStateMachine
  }
}
