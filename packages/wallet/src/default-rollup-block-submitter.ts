import { DB, getLogger } from '@pigi/core'
import { Block } from 'ethers/providers'
import { Contract } from 'ethers'

import { RollupBlock } from './types'

const log = getLogger('rollup-block-submitter')

const LAST_CONFIRMED_KEY: Buffer = Buffer.from('last_confirmed')
const LAST_SUBMITTED_KEY: Buffer = Buffer.from('last_submitted')
const LAST_QUEUED_KEY: Buffer = Buffer.from('last_queued')

export class DefaultRollupBlockSubmitter {
  private lastSubmitted: number
  private lastConfirmed: number
  private lastQueued: number
  private blockQueue: RollupBlock[]

  constructor(private db: DB, private readonly rollupContract: Contract) {
    this.blockQueue = []
  }

  public async init(): Promise<void> {
    const [
      lastSubmittedBuffer,
      lastConfirmedBuffer,
      lastQueuedBuffer,
    ] = await Promise.all([
      this.db.get(LAST_SUBMITTED_KEY),
      this.db.get(LAST_CONFIRMED_KEY),
      this.db.get(LAST_QUEUED_KEY),
    ])

    this.lastSubmitted = !!lastSubmittedBuffer
      ? parseInt(lastSubmittedBuffer.toString(), 10)
      : 0
    this.lastConfirmed = !!lastConfirmedBuffer
      ? parseInt(lastConfirmedBuffer.toString(), 10)
      : 0
    this.lastQueued = !!lastQueuedBuffer
      ? parseInt(lastQueuedBuffer.toString(), 10)
      : 0

    // We're up to date, return
    if (
      this.lastSubmitted === this.lastConfirmed &&
      this.lastConfirmed === this.lastQueued
    ) {
      return
    }

    // We need to populate the queue from storage
    if (this.lastSubmitted !== this.lastQueued) {
      const promises: Array<Promise<Buffer>> = []
      for (let i = this.lastSubmitted; i < this.lastQueued; i++) {
        promises.push(this.db.get(this.getBlockKey(i)))
      }
      const blocks: Buffer[] = await Promise.all(promises)
      this.blockQueue = blocks.map((x) =>
        this.deserializeRollupBlockFromStorage(x)
      )
    }

    await this.trySubmitNextBlock()
  }

  public async submitBlock(rollupBlock: RollupBlock): Promise<void> {
    this.blockQueue.push(rollupBlock)
    await this.db.put(
      this.getBlockKey(rollupBlock.number),
      this.serializeRollupBlockForStorage(rollupBlock)
    )

    this.lastQueued = rollupBlock.number
    await this.db.put(LAST_QUEUED_KEY, this.numberToBuffer(this.lastQueued))

    await this.trySubmitNextBlock()
  }

  public async handleNewRollupBlock(rollupBlockNumber: number): Promise<void> {
    if (!this.blockQueue.length) {
      log.error(
        `Received block when no blocks pending: ${JSON.stringify(
          rollupBlockNumber
        )}`
      )
      return
    }

    if (rollupBlockNumber === this.blockQueue[0].number) {
      this.blockQueue.shift()
      this.lastConfirmed = rollupBlockNumber
      await this.db.put(
        LAST_CONFIRMED_KEY,
        this.numberToBuffer(this.lastConfirmed)
      )
      await this.trySubmitNextBlock()
    }
  }

  private async trySubmitNextBlock() {
    // If block has been submitted and is pending, return
    if (
      this.lastSubmitted > this.lastConfirmed ||
      this.lastSubmitted >= this.lastQueued ||
      !this.blockQueue.length
    ) {
      log.debug(
        `Next block queued but not submitted because block ${this.lastSubmitted} was submitted but not yet confirmed.`
      )
      return
    }

    const block: RollupBlock = this.blockQueue.shift()

    log.debug(
      `Submitting block number ${block.number}: ${JSON.stringify(block)}.`
    )
    const receipt = await this.rollupContract.submitBlock(
      this.serializeRollupBlockForSubmission(block)
    )
    // TODO: do something with receipt?

    this.lastSubmitted = block.number
    await this.db.put(
      LAST_SUBMITTED_KEY,
      this.numberToBuffer(this.lastSubmitted)
    )
  }

  private getBlockKey(blockNumber: number): Buffer {
    return Buffer.from(`BLOCK_${blockNumber.toString()}`)
  }

  private serializeRollupBlockForSubmission(block: RollupBlock): string[] {
    return block.transitions.map((x) => x.stateRoot)
  }

  private serializeRollupBlockForStorage(rollupBlock: RollupBlock): Buffer {
    return Buffer.from(
      'TODO: Create a serialization function out of this and delete this function.'
    )
  }

  private deserializeRollupBlockFromStorage(
    rollupBlockBuffer: Buffer
  ): RollupBlock {
    // TODO: This for real
    return {
      number: 0,
      transitions: [],
    }
  }

  private numberToBuffer(num: number): Buffer {
    return Buffer.from(num.toString(10))
  }
}
