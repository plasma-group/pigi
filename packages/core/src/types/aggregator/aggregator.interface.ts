import { Transaction } from '../serialization'

export interface Aggregator {
  /**
   * Notifies the Aggregator of the provided Transaction so it may be included in the next block.
   *
   * @param transaction the Transaction in question
   * @param witness the Witness of the Transaction in question
   */
  ingestTransaction(transaction: Transaction, witness: string): Promise<void>
}
