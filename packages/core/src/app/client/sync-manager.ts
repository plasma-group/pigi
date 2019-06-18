/* Internal Imports */
import { SyncManager, SyncDB } from '../../interfaces'
import { sleep, asyncFilter } from '../common'

/**
 * Simple SyncManager implementation.
 */
export class DefaultSyncManager implements SyncManager {
  private syncing = false

  /**
   * Initializes the manager.
   * @param syncdb The SyncDB instance to store data to.
   */
  constructor(private syncdb: SyncDB) {}

  /**
   * Adds a synchronization query for a given commitment contract.
   * @param commitmentContract Commitment contract to add a query for.
   * @param stateQuery Synchronization query to add to the contract.
   */
  public async addSyncQuery(
    commitmentContract: string,
    stateQuery: StateQuery
  ): Promise<void> {
    await this.syncdb.addSyncQuery(commitmentContract, stateQuery)
  }

  /**
   * Removes a synchronization query for a given commitment contract.
   * @param commitmentContract Commitment contract to remove a query from.
   * @param stateQuery Synchronization query to remove from the contract.
   */
  public async removeSyncQuery(
    commitmentContract: string,
    stateQuery: StateQuery
  ): Promise<void> {
    await this.syncdb.removeSyncQuery(commitmentContract, stateQuery)
  }

  /**
   * Queries the list of synchronization queries for a given commitment contract.
   * @param commitmentContract Commitment contract to get synchronization queries for.
   * @returns the list of sync queries for the contract
   */
  public async getSyncQueries(
    commitmentContract: string
  ): Promise<StateQuery[]> {
    return this.syncdb.getSyncQueries(commitmentContract)
  }

  /**
   * Starts the synchronization loop.
   */
  public startSyncLoop(): void {
    if (this.syncing) {
      return
    }

    this.syncing = true
    this.syncLoop()
  }

  /**
   * Stops the synchronization loop.
   */
  public stopSyncLoop(): void {
    this.syncing = false
  }

  /**
   * @returns `true` if the manager is syncing, `false` otherwise.
   */
  public isSyncing(): boolean {
    return this.syncing
  }

  /**
   * Runs the synchronization loop.
   */
  private async syncLoop(): Promise<void> {
    if (!this.syncing) {
      return
    }

    try {
      await this.sync()
    } finally {
      await sleep(15000) // TODO: Figure out how to config this.
      syncLoop()
    }
  }

  /**
   * Synchronizes the client's state with the operator's state.
   */
  private sync(): Promise<void> {
    const commitmentContracts = await this.syncdb.getCommitmentContracts()

    // Synchronize with each commitment contract.
    for (const commitmentContract of commitmentContracts) {
      const operator // TODO: Figure out how to get the operator from the commitment contract.

      // Skip if we've already synchronized up to the current block.
      const lastSyncedBlock = await this.syncdb.getLastSyncedBlock(
        commitmentContract
      )
      const currentBlock = await operator.getBlockNumber()
      if (lastSyncedBlock >= currentBlock) {
        continue
      }

      // Query the operator for a list of unseen state updates for this commitment contract.
      const syncQueries = await this.syncdb.getSyncQueries(commitmentContract)
      let unseen: StateUpdate[] = []
      for (const syncQuery of syncQueries) {
        const updates = await operator.stateQuery(syncQuery).map((result) => {
          return result.stateUpdate
        })

        unseen = unseen.concat(
          await asyncFilter(updates, async (update) => {
            return true // TODO: Check that the result hasn't already been seen.
          })
        )
      }

      // Query and apply the history for each unseen state update.
      for (const update of unseen) {
        const history = await operator.getHistory({
          plasmaContract: update.plasmaContract,
          start: update.range.start,
          end: update.range.end,
        })

        // TODO: Apply the history proof.
        // TODO: Figure out what to do if the history proof fails.
      }

      await this.syncdb.setLastSyncedBlock(lastSyncedBlock + 1)
    }
  }
}
