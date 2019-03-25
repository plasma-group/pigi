/* External Imports */
import { Service, OnStart } from '@nestd/core'
import { Transaction } from '@pigi/utils'

/* Services */
import { BaseDBProvider } from '../backends/base-db.provider'
import { DBService } from '../db.service'

/* Internal Imports */
import { ContractService } from '../../eth/contract.service'
import { DB_PREFIXES } from '../../../constants'

/**
 * Service that exposes an interface to sync-related
 * database calls.
 */
@Service()
export class SyncDB implements OnStart {
  constructor(
    private readonly contract: ContractService,
    private readonly dbservice: DBService
  ) {}

  /**
   * @returns the current db instance.
   */
  get db(): BaseDBProvider {
    const db = this.dbservice.dbs.sync
    if (db === undefined) {
      throw new Error('SyncDB is not yet initialized.')
    }
    return db
  }

  public async onStart(): Promise<void> {
    const address = await this.contract.waitForAddress()
    await this.dbservice.open({ namespace: 'sync', id: address })
  }

  /**
   * Returns the last synced block for a given event.
   * @param event Name of the event.
   * @returns Last synced block number.
   */
  public async getLastLoggedBlock(event: string): Promise<number> {
    return (await this.db.get(
      DB_PREFIXES.LAST_LOGGED_BLOCK,
      event,
      -1
    )) as number
  }

  /**
   * Sets the last synced block for a given event.
   * @param event Name of the event.
   * @param block Last synced block number.
   */
  public async setLastLoggedBlock(event: string, block: number): Promise<void> {
    await this.db.set(DB_PREFIXES.LAST_LOGGED_BLOCK, event, block)
  }

  /**
   * Checks whether an event has been seen.
   * @param event Hash of the event.
   * @returns `true` if the event has been seen, `false` otherwise.
   */
  public async getEventSeen(event: string): Promise<boolean> {
    return (await this.db.get(DB_PREFIXES.SEEN_EVENTS, event, false)) as boolean
  }

  /**
   * Marks an event as seen.
   * @param event Hash of the event.
   */
  public async setEventSeen(event: string): Promise<void> {
    await this.db.set(DB_PREFIXES.SEEN_EVENTS, event, true)
  }

  /**
   * Returns the last synced block.
   * @returns Last synced block number.
   */
  public async getLastSyncedBlock(): Promise<number> {
    return (await this.db.get(
      DB_PREFIXES.LAST_SYNCED_BLOCK,
      null,
      -1
    )) as number
  }

  /**
   * Sets the last synced block number.
   * @param block Block number to set.
   */
  public async setLastSyncedBlock(block: number): Promise<void> {
    await this.db.set(DB_PREFIXES.LAST_SYNCED_BLOCK, null, block)
  }

  /**
   * Returns transactions that failed to sync.
   * @returns An array of encoded transactions.
   */
  public async getFailedTransactions(): Promise<Transaction[]> {
    const encodedTxs = (await this.db.get(
      DB_PREFIXES.FAILED_TRANSACTION_IMPORTS,
      null,
      []
    )) as string[]
    return encodedTxs.map((encodedTx) => {
      return Transaction.from(encodedTx)
    })
  }

  /**
   * Sets the failed transactions.
   * @param transactions An array of encoded transactions.
   */
  public async setFailedTransactions(transactions: string[]): Promise<void> {
    await this.db.set(
      DB_PREFIXES.FAILED_TRANSACTION_IMPORTS,
      null,
      transactions
    )
  }
}
