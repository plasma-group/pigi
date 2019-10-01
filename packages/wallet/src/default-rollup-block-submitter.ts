import { DB, getLogger } from '@pigi/core'
import { Block } from 'ethers/providers'
import { Contract } from 'ethers'

import { RollupBlock, RollupBlockSubmitter } from './types'
import { abiEncodeTransition, parseTransitionFromABI } from './serialization'

const log = getLogger('rollup-block-submitter')

export class DefaultRollupBlockSubmitter implements RollupBlockSubmitter {
  public static readonly LAST_CONFIRMED_KEY: Buffer = Buffer.from(
    'last_confirmed'
  )
  public static readonly LAST_SUBMITTED_KEY: Buffer = Buffer.from(
    'last_submitted'
  )
  public static readonly LAST_QUEUED_KEY: Buffer = Buffer.from('last_queued')

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
      this.db.get(DefaultRollupBlockSubmitter.LAST_SUBMITTED_KEY),
      this.db.get(DefaultRollupBlockSubmitter.LAST_CONFIRMED_KEY),
      this.db.get(DefaultRollupBlockSubmitter.LAST_QUEUED_KEY),
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
    if (this.lastConfirmed !== this.lastQueued) {
      let i: number = this.lastConfirmed + 1
      const promises: Array<Promise<Buffer>> = []
      for (; i <= this.lastQueued; i++) {
        promises.push(this.db.get(DefaultRollupBlockSubmitter.getBlockKey(i)))
      }

      const blocks: Buffer[] = await Promise.all(promises)
      this.blockQueue = blocks.map((x) =>
        DefaultRollupBlockSubmitter.deserializeRollupBlockFromStorage(x)
      )
    }

    await this.trySubmitNextBlock()
  }

  public async submitBlock(rollupBlock: RollupBlock): Promise<void> {
    if (rollupBlock.number <= this.lastQueued) {
      log.error(
        `submitBlock(...) called on old block. Last Queued: ${
          this.lastQueued
        }, received: ${JSON.stringify(rollupBlock)}`
      )
      return
    }

    this.blockQueue.push(rollupBlock)
    await this.db.put(
      DefaultRollupBlockSubmitter.getBlockKey(rollupBlock.number),
      DefaultRollupBlockSubmitter.serializeRollupBlockForStorage(rollupBlock)
    )

    this.lastQueued = rollupBlock.number
    await this.db.put(
      DefaultRollupBlockSubmitter.LAST_QUEUED_KEY,
      this.numberToBuffer(this.lastQueued)
    )

    await this.trySubmitNextBlock()
  }

  public async handleNewRollupBlock(rollupBlockNumber: number): Promise<void> {
    if (!this.blockQueue.length) {
      log.error(
        `Received block when no blocks pending. Block #: ${JSON.stringify(
          rollupBlockNumber
        )}`
      )
      return
    }

    if (rollupBlockNumber === this.blockQueue[0].number) {
      this.blockQueue.shift()
      this.lastConfirmed = rollupBlockNumber
      await this.db.put(
        DefaultRollupBlockSubmitter.LAST_CONFIRMED_KEY,
        this.numberToBuffer(this.lastConfirmed)
      )

      // If we failed after submission but before storing submitted, update lastSubmitted
      if (this.lastSubmitted < this.lastConfirmed) {
        this.lastSubmitted = rollupBlockNumber
        await this.db.put(
          DefaultRollupBlockSubmitter.LAST_SUBMITTED_KEY,
          this.numberToBuffer(this.lastSubmitted)
        )
      }
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
      DefaultRollupBlockSubmitter.serializeRollupBlockForSubmission(block)
    )
    // TODO: do something with receipt?

    this.lastSubmitted = block.number
    await this.db.put(
      DefaultRollupBlockSubmitter.LAST_SUBMITTED_KEY,
      this.numberToBuffer(this.lastSubmitted)
    )
  }

  public static serializeRollupBlockForSubmission(
    block: RollupBlock
  ): string[] {
    return block.transitions.map((x) => x.stateRoot)
  }

  public static serializeRollupBlockForStorage(
    rollupBlock: RollupBlock
  ): Buffer {
    const encodedTransitions: string[] = rollupBlock.transitions.map((x) =>
      abiEncodeTransition(x)
    )
    return Buffer.from(
      `${rollupBlock.number.toString(10)}|${JSON.stringify(encodedTransitions)}`
    )
  }

  public static deserializeRollupBlockFromStorage(
    rollupBlockBuffer: Buffer
  ): RollupBlock {
    const [number, json] = rollupBlockBuffer.toString().split('|')
    return {
      number: parseInt(number, 10),
      transitions: JSON.parse(json).map((x) => parseTransitionFromABI(x)),
    }
  }

  public static getBlockKey(blockNumber: number): Buffer {
    return Buffer.from(`BLOCK_${blockNumber.toString()}`)
  }

  private numberToBuffer(num: number): Buffer {
    return Buffer.from(num.toString(10))
  }

  /***********
   * GETTERS *
   ***********/
  public getLastSubmitted(): number {
    return this.lastSubmitted
  }
  public getLastConfirmed(): number {
    return this.lastConfirmed
  }
  public getLastQueued(): number {
    return this.lastQueued
  }
}
