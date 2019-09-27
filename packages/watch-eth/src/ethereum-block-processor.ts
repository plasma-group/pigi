import { ethers } from 'ethers'
import { DB, getLogger, logError } from '@pigi/core'

import { BlockEventHandler } from './interfaces'

const log = getLogger('ethereum-block-processor')

const blockKey: Buffer = Buffer.from('latestBlock')

/**
 * Ethereum Block Processor
 * Single place through which all block subscriptions are handled.
 */
export class EthereumBlockProcessor {
  private readonly subscriptions: Set<BlockEventHandler>
  private currentBlockNumber: number

  constructor(
    private readonly db: DB,
    private readonly earliestBlock: number = 0
  ) {
    this.subscriptions = new Set<BlockEventHandler>()
    this.currentBlockNumber = 0
  }

  /**
   * Subscribes to new blocks.
   * This will also fetch and send the provided event handler all historical blocks not in
   * the database unless backfill is set to false.
   *
   * @param provider The provider with the connection to the blockchain
   * @param handler The event handler subscribing
   * @param backfill Whether or not to fetch previous events
   */
  public async subscribe(
    provider: ethers.providers.Provider,
    handler: BlockEventHandler,
    backfill: boolean = true
  ): Promise<void> {
    this.subscriptions.add(handler)

    provider.on('block', async (blockNumber) => {
      log.debug(`Block [${+blockNumber}] was mined!`)
      await this.fetchAndDisemminateBlock(provider, blockNumber)
      try {
        await this.db.put(blockKey, Buffer.from(blockNumber.toString()))
      } catch (e) {
        logError(
          log,
          `Error storing most recent block received [${blockNumber}]!`,
          e
        )
      }
    })

    if (backfill) {
      await this.backfillBlocks(provider)
    }
  }

  /**
   * Fetches and broadcasts the Block for the provided block number.
   *
   * @param provider The provider with the connection to the blockchain
   * @param blockNumber The block number
   */
  private async fetchAndDisemminateBlock(
    provider: ethers.providers.Provider,
    blockNumber: number
  ): Promise<void> {
    const block: ethers.providers.Block = await provider.getBlock(blockNumber)

    this.subscriptions.forEach((h) => {
      try {
        // purposefully ignore promise
        h.handleBlock(block)
      } catch (e) {
        // should be logged in handler
      }
    })
  }

  /**
   * Fetches historical blocks.
   *
   * @param provider The provider with the connection to the blockchain.
   */
  private async backfillBlocks(
    provider: ethers.providers.Provider
  ): Promise<void> {
    log.debug(`Backfilling blocks`)
    const blockNumber = await this.getBlockNumber(provider)

    const lastSyncedBlockBuffer: Buffer = await this.db.get(
      Buffer.from(blockKey)
    )
    const lastSyncedNumber: number = !!lastSyncedBlockBuffer
      ? parseInt(lastSyncedBlockBuffer.toString(), 10)
      : this.earliestBlock - 1

    if (blockNumber === lastSyncedNumber) {
      return
    }

    for (let i = lastSyncedNumber + 1; i <= blockNumber; i++) {
      await this.fetchAndDisemminateBlock(provider, i)
    }

    log.debug(
      `backfilled from block [${lastSyncedNumber}] to [${blockNumber}]!`
    )
  }

  /**
   * Fetches the current block number from the given provider.
   *
   * @param provider The provider connected to a node
   * @returns The current block number
   */
  private async getBlockNumber(
    provider: ethers.providers.Provider
  ): Promise<number> {
    if (this.currentBlockNumber === 0) {
      this.currentBlockNumber = await provider.getBlockNumber()
    }

    return this.currentBlockNumber
  }
}
