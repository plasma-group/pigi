/* Internal Imports */
import { StateQuery } from '../common'

export interface SyncManager {
  addDepositContract(commitmentContract: string, depositContract: string): Promise<void>
  removeDepositContract(commitmentContract: string, depositContract: string): Promise<void>
  addSyncQuery(commitmentContract: string, stateQuery: StateQuery): Promise<void>
  removeSyncQuery(commitmentContract: string, stateQuery: StateQuery): Promise<void>
  getSyncQueries(commitmentContract: string): Promise<StateQuery[]>
}
