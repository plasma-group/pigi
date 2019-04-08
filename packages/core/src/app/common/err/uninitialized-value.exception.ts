/* Internal Imports */
import { RuntimeException } from './runtime.exception'

/**
 * Exception thrown when a variable hasn't been initialized.
 */
export class UninitializedValueException extends RuntimeException {
  /**
   * Creates the exception.
   * @param name Name of the variable that hasn't been initialized.
   */
  constructor(name: string) {
    super(`Value "${name}" has not yet been initialized.`)
  }
}
