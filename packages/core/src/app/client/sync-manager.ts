/* Internal Imports */
import { SyncManager, SyncDB } from '../../interfaces'
import { sleep } from '../common'

/**
 * Simple SyncManager implementation.
 */
export class DefaultSyncManager implements SyncManager {
  /**
   * Initializes the manager.
   * @param syncdb The SyncDB instance to store data to.
   */
  constructor(private syncdb: SyncDB) { }

  /**
   * Adds a deposit contract for a given commitment contract.
   * @param commitmentContract Commitment contract to add a deposit contract for.
   * @param depositContract Deposit contract to add.
   */
  public async addDepositContract(commitmentContract: string, depositContract: string): Promise<void> {
    await this.syncdb.addDepositContract(commitmentContract, depositContract)
  }

  /**
   * Removes a deposit contract from a commitment contract.
   * @param commitmentContract Commitment contract to remove the deposit contract from.
   * @param depositContract Deposit contract to remove.
   */
  public async removeDepositContract(commitmentContract: string, depositContract: string): Promise<void> {
    await this.syncdb.removeDepositContract(commitmentContract, depositContract)
  }

  /**
   * Adds a synchronization query for a given commitment contract.
   * @param commitmentContract Commitment contract to add a query for.
   * @param stateQuery Synchronization query to add to the contract.
   */
  public async addSyncQuery(commitmentContract: string, stateQuery: StateQuery): Promise<void> {
    await this.syncdb.addSyncQuery(commitmentContract, stateQuery)
  }

  /**
   * Removes a synchronization query for a given commitment contract.
   * @param commitmentContract Commitment contract to remove a query from.
   * @param stateQuery Synchronization query to remove from the contract.
   */
  public async removeSyncQuery(commitmentContract: string, stateQuery: StateQuery): Promise<void> {
    await this.syncdb.removeSyncQuery(commitmentContract, stateQuery)
  }

  /**
   * Queries the list of synchronization queries for a given commitment contract.
   * @param commitmentContract Commitment contract to get synchronization queries for.
   * @returns the list of sync queries for the contract
   */
  public async getSyncQueries(commitmentContract: string): Promise<StateQuery[]> {
    return this.syncdb.getSyncQueries(commitmentContract)
  }

  private startSyncLoop(): void {
    if (this.syncing) {
      return
    }

    this.syncing = true
    this.syncLoop()
  }

  private stopSyncLoop(): void {
    this.syncing = false
  }

  private async syncLoop(): Promise<void> {
    if (!this.syncing) {
      return
    }

    try {
      await this.sync()
    } catch (err) {
      // TODO: Figure out how to handle errors in the sync loop.
    } finally {
      await sleep(15000) // TODO: Figure out how to config this.
      syncLoop()
    }
  }

  private sync(): Promise<void> {
    
  }
}
