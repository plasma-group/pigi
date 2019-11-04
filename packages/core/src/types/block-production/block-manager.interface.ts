/* External Imports */
import { BigNumber } from '@pigi/core-utils'

/* Internal Imports */
import { StateUpdate } from '../serialization'

/**
 * Block Manager wrapping Block CRUD operations.
 */
export interface BlockManager {
  getNextBlockNumber(): Promise<BigNumber>
  addPendingStateUpdate(stateUpdate: StateUpdate): Promise<void>
  getPendingStateUpdates(): Promise<StateUpdate[]>
  submitNextBlock(): Promise<void>
}
