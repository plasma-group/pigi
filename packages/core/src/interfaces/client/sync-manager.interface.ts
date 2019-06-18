/* Internal Imports */
import { StateQuery } from '../common'

export interface SyncManager {
  addSyncQuery(
    commitmentContract: string,
    stateQuery: StateQuery
  ): Promise<void>
  removeSyncQuery(
    commitmentContract: string,
    stateQuery: StateQuery
  ): Promise<void>
  getSyncQueries(commitmentContract: string): Promise<StateQuery[]>
  startSyncLoop(): void
  stopSyncLoop(): void
  isSyncing(): boolean
}
