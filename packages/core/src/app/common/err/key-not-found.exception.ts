/* Internal Imports */
import { RuntimeException } from './runtime.exception'

/**
 * Exception thrown when a key isn't found during a lookup.
 */
export class KeyNotFoundException extends RuntimeException {
  /**
   * Creates the exception.
   * @param key Name of the key that wasn't found.
   * @param context Context in which the key wasn't found.
   */
  constructor(key: string, context: string) {
    super(`Key "${key}" was not found during lookup in ${context}.`)
  }
}
