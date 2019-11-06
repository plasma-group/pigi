/* External Imports */
import { BigNumber } from '@pigi/core-utils'

/* Internal Imports */
import { VerifiedStateUpdate } from './state'

export interface StateDBInterface {
  /**
   * Gets the VerifiedStateUpdates for the provided Range.
   *
   * @param start the start (inclusive) of the range for which VerifiedStateUpdates are being requested
   * @param end the end (exclusive) of the range for which VerifiedStateUpdates are being requested
   * @returns the VerifiedStateUpdates that intersect with the provided range.
   */
  getVerifiedStateUpdates(
    start: BigNumber,
    end: BigNumber
  ): Promise<VerifiedStateUpdate[]>

  /**
   * Adds the provided VerifiedStateUpdate to the State DB, overwriting, modifying, and/or breaking apart any existing
   * objects in the DB that intersect with this one.
   *
   * @param verifiedStateUpdate the VerifiedStateUpdate to add
   * @returns an empty Promise that will resolve successfully on success or with an error if the insert fails.
   */
  putVerifiedStateUpdate(
    verifiedStateUpdate: VerifiedStateUpdate
  ): Promise<void>
}
