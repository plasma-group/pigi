export * from './rollup-aggregator'
export * from './rollup-client'
export * from './rollup-state-machine'
export * from './serialization/'
export * from './types/'
export * from './unipig-wallet'
export * from './utils'

/* Constants */
export const AGGREGATOR_ADDRESS = '0xAc001762c6424F4959852A516368DBf970C835a7'
export const UNISWAP_ADDRESS = '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF'
export const UNI_TOKEN_TYPE = 0
export const PIGI_TOKEN_TYPE = 1

/* Aggregator API */
export const AGGREGATOR_API = {
  getState: 'getState',
  getUniswapState: 'getUniswapBalances',
  applyTransaction: 'applyTransaction',
  requestFaucetFunds: 'requestFaucetFunds',
}
