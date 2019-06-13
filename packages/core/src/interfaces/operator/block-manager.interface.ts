/* Internal Imports */
import { StateUpdate } from '../common/utils/state.interface'

export interface BlockManager {
  getNextBlockNumber(): Promise<number>
  addPendingStateUpdate(stateUpdate: StateUpdate): Promise<void>
  getPendingStateUpdates(): Promise<StateUpdate[]>
  submitNextBlock(): Promise<void>
}
