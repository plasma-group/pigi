/* External Imports */
import * as Level from 'level'
import { Contract, Wallet } from 'ethers'
import { JsonRpcProvider } from 'ethers/providers'

import { BaseDB, DB, getLogger } from '@pigi/core'

import { EthereumEventProcessor } from '@pigi/watch-eth'

import { config } from 'dotenv'
import { resolve } from 'path'

// Starting from build/src/validator/
config({ path: resolve(__dirname, `../../../.env`) })

/* Internal Imports */
import * as RollupChain from './contracts/RollupChain.json'
import { RollupStateValidator } from '../types'
import {
  DefaultRollupStateValidator,
  genesisState,
  RollupFraudGuard,
} from '../index'

const log = getLogger('monitor-and-validate')

const rollupContractAddress = process.env.ROLLUP_CONTRACT_ADDRESS
const mnemonic = process.env.WALLET_MNEMONIC
const jsonRpcUrl = process.env.JSON_RPC_URL

const waitForever = (): Promise<void> => {
  return new Promise(() => {
    // Don't ever resolve
  })
}

async function runValidator() {
  const levelOptions = {
    keyEncoding: 'binary',
    valueEncoding: 'binary',
  }
  const validatorDB = new BaseDB((await Level(
    'build/level/validator',
    levelOptions
  )) as any)

  log.debug(
    `Connecting to contract [${rollupContractAddress}] at [${jsonRpcUrl}]`
  )
  const contract: Contract = new Contract(
    rollupContractAddress,
    RollupChain.interface,
    Wallet.fromMnemonic(mnemonic).connect(new JsonRpcProvider(jsonRpcUrl))
  )
  log.debug(`Connected`)

  const validator: RollupStateValidator = await DefaultRollupStateValidator.create(
    genesisState,
    validatorDB
  )

  const fraudGuard: RollupFraudGuard = await RollupFraudGuard.create(
    validatorDB,
    validator,
    contract
  )

  const blockProcessorDB: DB = new BaseDB(
    (await Level('build/level/validator-blockProcessor', levelOptions)) as any,
    256
  )
  const processor: EthereumEventProcessor = new EthereumEventProcessor(
    blockProcessorDB
  )

  await processor.subscribe(contract, 'NewRollupBlock', fraudGuard, true)

  log.info(`Started. Waiting forever.`)
  await waitForever()
}

runValidator()
