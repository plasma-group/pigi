/* Internal Imports */
import { StateUpdate } from '../common/utils/state.interface'

export interface BlockDB {
  getNextBlockNumber(): Promise<number>
  addPendingStateUpdate(stateUpdate: StateUpdate): Promise<void>
  getPendingStateUpdates(): Promise<StateUpdate[]>
  getMerkleRoot(blockNumber: number): Promise<string>
  finalizeNextBlock(): Promise<void>
}
