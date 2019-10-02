import { Contract, ContractFactory, Wallet, ethers } from 'ethers'
import { config } from 'dotenv'
import { resolve } from 'path'

import * as RollupChain from '../build/RollupChain.json'
import * as UnipigTransitionEvaluator from '../build/UnipigTransitionEvaluator.json'
import * as RollupMerkleUtils from '../build/RollupMerkleUtils.json'
import { Provider } from 'ethers/providers'

// Note: Path is from 'build/deploy/deploy-rollup-chain.js'
config({ path: resolve(__dirname, '../../.env') })

const deployContract = async (
  contractJson: any,
  wallet: Wallet,
  ...args: any
): Promise<Contract> => {
  const factory = new ContractFactory(
    contractJson.abi,
    contractJson.bytecode,
    wallet
  )
  const contract = await factory.deploy(...args)
  console.log(
    `Address: [${contract.address}], Tx: [${contract.deployTransaction.hash}]`
  )
  return contract.deployed()
}

const deployContracts = async (wallet: Wallet): Promise<void> => {
  let evaluatorContractAddress = process.env.DEPLOY_EVALUATOR_CONTRACT_ADDRESS
  if (!evaluatorContractAddress) {
    console.log('Deploying UnipigTransitionEvaluator...')
    const transitionEvaluator = await deployContract(
      UnipigTransitionEvaluator,
      wallet
    )
    evaluatorContractAddress = transitionEvaluator.address
    console.log('UnipigTransitionEvaluator deployed!\n\n')
  } else {
    console.log(
      `Using UnipigTransitionEvaluator contract at ${evaluatorContractAddress}\n`
    )
  }

  let merkleUtilsCnontractAddress =
    process.env.DEPLOY_MERKLE_UTILS_CONTRACT_ADDRESS
  if (!merkleUtilsCnontractAddress) {
    console.log('Deploying RollupMerkleUtils...')
    const merkleUtils = await deployContract(RollupMerkleUtils, wallet)
    merkleUtilsCnontractAddress = merkleUtils.address
    console.log('RollupMerkleUtils deployed!\n\n')
  } else {
    console.log(
      `Using RollupMerkleUtils contract at ${merkleUtilsCnontractAddress}\n`
    )
  }

  console.log('Deploying RollupChain...')
  const rollupChain = await deployContract(
    RollupChain,
    wallet,
    evaluatorContractAddress,
    merkleUtilsCnontractAddress
  )
  console.log('RollupChain deployed!\n\n')
}

const deploy = async (): Promise<void> => {
  console.log(`\n\n********** STARTING DEPLOYMENT ***********\n\n`)
  // Make sure mnemonic exists
  const deployMnemonic = process.env.DEPLOY_MNEMONIC
  if (!deployMnemonic) {
    console.log(`No DEPLOY_MNEMONIC env var set. Please set it and try again.`)
    return
  }

  // Connect provider
  let provider: Provider
  const network = process.env.DEPLOY_NETWORK
  if (!network || network === 'local') {
    provider = new ethers.providers.JsonRpcProvider(
      process.env.DEPLOY_LOCAL_URL || 'http://127.0.0.1:7545'
    )
  } else {
    provider = ethers.getDefaultProvider(network)
  }

  // Create wallet
  const wallet = Wallet.fromMnemonic(deployMnemonic).connect(provider)

  console.log(`\nDeploying to network [${network || 'local'}] in 5 seconds!\n`)
  setTimeout(() => {
    deployContracts(wallet)
  }, 5_000)
}

deploy()
