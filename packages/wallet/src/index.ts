export * from './rollup-aggregator'
export * from './rollup-client'
export * from './rollup-state-machine'
export * from './serialization/'
export * from './types/'
export * from './unipig-wallet'
export * from './utils'

/* Aggregator API */
export const AGGREGATOR_API = {
  getState: 'getState',
  getUniswapState: 'getUniswapBalances',
  applyTransaction: 'applyTransaction',
  requestFaucetFunds: 'requestFaucetFunds',
}
