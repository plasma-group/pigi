/* External Imports */
import { DB, getLogger, logError } from '@pigi/core'
import { Block, Provider } from 'ethers/providers'

/* Internal Imports */
import { EthereumListener } from './interfaces/listener'

const log = getLogger('ethereum-block-processor')
const blockKey: Buffer = Buffer.from('latestBlock')

/**
 * Ethereum Block Processor
 * Single place through which all block subscriptions are handled.
 */
export class EthereumBlockProcessor {
  private readonly subscriptions: Set<EthereumListener<Block>>
  private currentBlockNumber: number

  private syncInProgress: boolean
  private syncCompleted: boolean

  constructor(
    private readonly db: DB,
    private readonly earliestBlock: number = 0
  ) {
    this.subscriptions = new Set<EthereumListener<Block>>()
    this.currentBlockNumber = 0

    this.syncInProgress = false
    this.syncCompleted = false
  }

  /**
   * Subscribes to new blocks.
   * This will also fetch and send the provided event handler all historical blocks not in
   * the database unless syncPastBlocks is set to false.
   *
   * @param provider The provider with the connection to the blockchain
   * @param handler The event handler subscribing
   * @param syncPastBlocks Whether or not to fetch previous events
   */
  public async subscribe(
    provider: Provider,
    handler: EthereumListener<Block>,
    syncPastBlocks: boolean = true,
  ): Promise<void> {
    this.subscriptions.add(handler)

    provider.on('block', async (blockNumber) => {
      log.debug(`Block [${blockNumber}] was mined!`)
      await this.fetchAndDisseminateBlock(provider, blockNumber)
      this.currentBlockNumber = blockNumber
      try {
        await this.db.put(
          blockKey,
          Buffer.from(this.currentBlockNumber.toString())
        )
      } catch (e) {
        logError(
          log,
          `Error storing most recent block received [${blockNumber}]!`,
          e
        )
      }
    })

    if (syncPastBlocks) {
      if (this.syncCompleted) {
        await handler.onSyncCompleted()
        return
      }

      if (!this.syncInProgress) {
        this.syncInProgress = true
        await this.syncBlocks(provider)
      }
    }
  }

  /**
   * Fetches and broadcasts the Block for the provided block number.
   *
   * @param provider The provider with the connection to the blockchain
   * @param blockNumber The block number
   */
  private async fetchAndDisseminateBlock(
    provider: Provider,
    blockNumber: number
  ): Promise<void> {
    log.debug(`Fetching block [${blockNumber}].`)
    const block: Block = await provider.getBlock(blockNumber, true)
    log.debug(`Received block: [${JSON.stringify(block)}].`)

    this.subscriptions.forEach((h) => {
      try {
        // purposefully ignore promise
        h.handle(block)
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
  private async syncBlocks(provider: Provider): Promise<void> {
    log.debug(`Syncing blocks`)
    const blockNumber = await this.getBlockNumber(provider)

    const lastSyncedBlockBuffer: Buffer = await this.db.get(blockKey)
    const lastSyncedNumber: number = !!lastSyncedBlockBuffer
      ? parseInt(lastSyncedBlockBuffer.toString(), 10)
      : this.earliestBlock - 1

    if (blockNumber === lastSyncedNumber) {
      log.debug(`Up to date, not syncing.`)
      this.finishSync(blockNumber, blockNumber)
      return
    }

    for (let i = lastSyncedNumber + 1; i <= blockNumber; i++) {
      await this.fetchAndDisseminateBlock(provider, i)
    }

    this.finishSync(lastSyncedNumber + 1, blockNumber)
  }

  private finishSync(syncStart: number, currentBlock: number): void {
    this.syncCompleted = true
    this.syncInProgress = false

    log.debug(
      `Synced from block [${syncStart}] to [${currentBlock}]!`
    )

    for (const callback of this.subscriptions) {
      callback.onSyncCompleted().catch((e) => {
        logError(log, "Error calling Block sync callback", e)
      })
    }
  }

  /**
   * Fetches the current block number from the given provider.
   *
   * @param provider The provider connected to a node
   * @returns The current block number
   */
  private async getBlockNumber(provider: Provider): Promise<number> {
    if (this.currentBlockNumber === 0) {
      this.currentBlockNumber = await provider.getBlockNumber()
    }

    log.debug(`Current block number: ${this.currentBlockNumber}`)
    return this.currentBlockNumber
  }
}
