import { Message } from '../serialization'

/**
 * Interface to allow generic Message subscription and processing.
 */
export interface MessageSubscriber {
  /**
   * Handles the provided message however its logic specifies.
   *
   * @param message The Message to handle
   */
  handleMessage(message: Message): Promise<void>
}
