/* External Imports */
import { BigNumber } from '@pigi/core-utils'

/* Internal Imports */
import { StateUpdate } from '../state'

export interface BlockDBInterface {
  getNextBlockNumber(): Promise<BigNumber>
  addPendingStateUpdate(stateUpdate: StateUpdate): Promise<void>
  getPendingStateUpdates(): Promise<StateUpdate[]>
  getMerkleRoot(blockNumber: BigNumber): Promise<Buffer>
  finalizeNextBlock(): Promise<void>
}
