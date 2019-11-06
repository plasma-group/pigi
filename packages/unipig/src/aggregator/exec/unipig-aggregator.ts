/* External Imports */
import * as Level from 'level'

import { DB, DBInterface, EthereumEventProcessor } from '@pigi/core-db'

import {
  Secp256k1SignatureProvider,
  Secp256k1SignatureVerifier,
  getLogger,
} from '@pigi/core-utils'

import cors = require('cors')
import { Contract, Wallet } from 'ethers'
import { JsonRpcProvider } from 'ethers/providers'

import * as fs from 'fs'
import { config } from 'dotenv'
import { resolve } from 'path'
// Starting from build/src/
config({ path: resolve(__dirname, `../../../../config/.env`) })

/* Internal Imports */
import * as RollupChain from '../../../build/contracts/RollupChain.json'
import { Address, RollupStateMachineInterface, State } from '../../types'
import { RollupStateMachine, getGenesisState } from '../../common'
import { RollupBlockSubmitter } from '../rollup-block-submitter'
import { RollupAggregator } from '../rollup-aggregator'
import { AggregatorServer } from '../aggregator-server'

const log = getLogger('unipig-aggregator')

const rollupContractAddress = process.env.ROLLUP_CONTRACT_ADDRESS
const aggregatorMnemonic = process.env.AGGREGATOR_MNEMONIC
const jsonRpcUrl = process.env.JSON_RPC_URL
const transitionsPerBlock: number = parseInt(
  process.env.TRANSITIONS_PER_BLOCK || '10',
  10
)
const blockSubmissionIntervalMillis: number = parseInt(
  process.env.BLOCK_SUBMISSION_INTERVAL_MILLIS || '300',
  10
)
const authorizedFaucetAddress: Address = process.env.AUTHORIZED_FAUCET_ADDRESS
const genesisStateFilePath: string =
  process.env.GENESIS_STATE_RELATIVE_FILE_PATH
let genesisState: State[]
if (!!genesisStateFilePath) {
  genesisState = JSON.parse(
    fs.readFileSync(resolve(__dirname, genesisStateFilePath)).toString('utf-8')
  )
  log.info(
    `Loaded genesis state from ${genesisStateFilePath}. ${genesisState.length} balances loaded.`
  )
} else {
  log.info('No genesis state provided!')
}

if (!rollupContractAddress || !aggregatorMnemonic || !jsonRpcUrl) {
  throw Error('Missing environment variables. Set them and try again.')
}

// Create a new aggregator... and then...
const host = '0.0.0.0'
const port = 3000

async function runAggregator() {
  const levelOptions = {
    keyEncoding: 'binary',
    valueEncoding: 'binary',
  }
  const stateDB = new DB((await Level(
    'build/level/state',
    levelOptions
  )) as any)
  const blockDB = new DB(
    (await Level('build/level/blocks', levelOptions)) as any,
    4
  )

  const aggregatorWallet: Wallet = Wallet.fromMnemonic(
    aggregatorMnemonic
  ).connect(new JsonRpcProvider(jsonRpcUrl))
  const rollupStateMachine: RollupStateMachineInterface = await RollupStateMachine.create(
    getGenesisState(aggregatorWallet.address, genesisState),
    stateDB,
    aggregatorWallet.address
  )

  log.debug(
    `Connecting to contract [${rollupContractAddress}] at [${jsonRpcUrl}]`
  )
  const contract: Contract = new Contract(
    rollupContractAddress,
    RollupChain.interface,
    aggregatorWallet
  )
  const blockSubmitterDB: DBInterface = new DB(
    (await Level('build/level/blockSubmitter', levelOptions)) as any,
    256
  )
  const blockSubmitter = await RollupBlockSubmitter.create(
    blockSubmitterDB,
    contract
  )
  log.debug(`Connected`)

  const aggregator = await RollupAggregator.create(
    blockDB,
    rollupStateMachine,
    blockSubmitter,
    new Secp256k1SignatureProvider(aggregatorWallet),
    Secp256k1SignatureVerifier.instance(),
    transitionsPerBlock,
    blockSubmissionIntervalMillis,
    authorizedFaucetAddress
  )

  const blockProcessorDB: DBInterface = new DB(
    (await Level('build/level/blockProcessor', levelOptions)) as any,
    256
  )
  const processor: EthereumEventProcessor = new EthereumEventProcessor(
    blockProcessorDB
  )
  await processor.subscribe(contract, 'NewRollupBlock', aggregator, true)

  const aggregatorServer = new AggregatorServer(aggregator, host, port, [cors])

  // Just listen for requests!
  aggregatorServer.listen()

  // tslint:disable-next-line
  console.log('Listening on', host + ':' + port)
}

runAggregator()
