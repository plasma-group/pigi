/* External Imports */
import { Event, EthereumListener } from '@pigi/watch-eth'
import { getLogger, logError } from '@pigi/core'

import { Contract } from 'ethers'
import { TransactionReceipt } from 'ethers/providers'

/* Internal Imports */
import { RollupBlock, RollupStateValidator } from '../types'
import { parseTransitionFromABI } from '../serialization'
import { ContractFraudProof } from './types'

const log = getLogger('rollup-fraud-guard')

/**
 * Handles NewRollupBlock events, checks for fraud, submits proof when there is fraud.
 */
export class RollupFraudGuard implements EthereumListener<Event> {
  public constructor(
    private readonly validator: RollupStateValidator,
    private readonly contract: Contract
  ) {}

  public async onSyncCompleted(syncIdentifier?: string): Promise<void> {
    // no-op
  }

  public async handle(event: Event): Promise<void> {
    log.debug(`Fraud Guard received event: ${JSON.stringify(event)}`)
    if (
      !!event &&
      !!event.values &&
      'block' in event.values &&
      'blockNumber' in event.values
    ) {
      let block: RollupBlock
      try {
        block = {
          blockNumber: (event.values['blockNumber'] as any).toNumber(),
          transitions: (event.values['block'] as string[]).map((x) =>
            parseTransitionFromABI(x)
          ),
        }
      } catch (e) {
        logError(
          log,
          `Error trying to parse event: ${JSON.stringify(event)}`,
          e
        )
        return
      }

      await this.validator.storeBlock(block)
      const proof: ContractFraudProof = await this.validator.validateStoredBlock(
        block.blockNumber
      )
      if (!!proof) {
        await this.submitFraudProof(proof)
      }
    }
  }

  private async submitFraudProof(proof: ContractFraudProof): Promise<void> {
    log.error(
      `Detected fraud. Submitting Fraud Proof: ${JSON.stringify(proof)}`
    )
    const receipt: TransactionReceipt = await this.contract.proveTransitionInvalid(
      ...proof
    )
    log.error(`Fraud proof submitted. Receipt: ${JSON.stringify(receipt)}`)

    log.info('Congrats! You helped the good guys win. +2 points for you!')
    process.exit(1)
  }
}
