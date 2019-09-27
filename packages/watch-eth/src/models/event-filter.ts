/* Internal Imports */
import { EventFilterOptions } from '../interfaces'
import { Md5Hash } from '@pigi/core'

/**
 * Represents an event filter.
 */
export class EventFilter {
  public options: EventFilterOptions

  constructor(options: EventFilterOptions) {
    this.options = options
  }

  /**
   * @returns the unique hash for this filter.
   */
  get hash(): string {
    return Md5Hash(JSON.stringify(this.options))
  }
}
