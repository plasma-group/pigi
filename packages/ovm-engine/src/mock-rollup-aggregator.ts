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

const getBalances = (address: Address) => {
  return { uni: 5, pigi: 10 }
}

export class MockAggregator extends SimpleServer {
  public rollupStateMachine: MockRollupStateMachine

  constructor(genesisState: State, hostname: string, port: number) {
    const rollupStateMachine = new MockRollupStateMachine(genesisState)
    const methods = {
      getBalances: (account: Address) =>
        rollupStateMachine.getBalances(account),
      getUniswapBalances: () => rollupStateMachine.getUniswapBalances(),
      applyTransaction: (transaction: SignedTransaction) =>
        rollupStateMachine.applyTransaction(transaction),
    }
    super(methods, hostname, port)
    this.rollupStateMachine = rollupStateMachine
  }
}
