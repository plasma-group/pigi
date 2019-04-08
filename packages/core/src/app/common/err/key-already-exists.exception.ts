/* Internal Imports */
import { RuntimeException } from './runtime.exception'

/**
 * Exception thrown when a key already exists.
 */
export class KeyAlreadyExistsException extends RuntimeException {
  /**
   * Creates the exception.
   * @param key Name of the key.
   * @param context Context in which the key already exists.
   */
  constructor(key: string, context: string) {
    super(`Key "${key}" already exists in ${context}.`)
  }
}
