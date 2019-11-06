/* External Imports */
import { BigNumber } from '@pigi/core-utils'

/* Internal Imports */
import { StateDBInterface, VerifiedStateUpdate } from '../../types'

/**
 * StateDBInterface used to store the state for different ranges.
 *
 * See: http://spec.plasma.group/en/latest/src/05-client-architecture/state-db.html for more details.
 */
export class StateDB implements StateDBInterface {
  public async getVerifiedStateUpdates(
    start: BigNumber,
    end: BigNumber
  ): Promise<VerifiedStateUpdate[]> {
    throw Error('StateDB.getVerifiedStateUpdates is not implemented.')
  }

  public async putVerifiedStateUpdate(
    verifiedStateUpdate: VerifiedStateUpdate
  ): Promise<void> {
    throw Error('StateDB.putVerifiedStateUpdate is not implemented.')
  }
}
