/* External Imports */
import { BigNumber } from '@pigi/core-utils'

/* Internal Imports */
import { StateUpdate } from '../state'

/**
 * Block Manager wrapping Block CRUD operations.
 */
export interface BlockManagerInterface {
  getNextBlockNumber(): Promise<BigNumber>
  addPendingStateUpdate(stateUpdate: StateUpdate): Promise<void>
  getPendingStateUpdates(): Promise<StateUpdate[]>
  submitNextBlock(): Promise<void>
}
