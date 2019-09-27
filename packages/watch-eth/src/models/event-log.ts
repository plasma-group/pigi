/* Internal Imports */
import { EventLog, EventLogData } from '../interfaces'
import { Md5Hash } from '@pigi/core'

/**
 * Represents a single event log.
 */
export class DefaultEventLog implements EventLog {
  public data: EventLogData

  constructor(data: EventLogData) {
    this.data = data
  }

  /**
   * Returns a unique hash for this event log.
   */
  public getHash(): string {
    return Md5Hash(this.data.transactionHash + this.data.logIndex)
  }
}
