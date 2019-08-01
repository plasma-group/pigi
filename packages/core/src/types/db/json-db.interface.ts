/**
 * Represents a json DB which stores indexable JSON records.
 */

export interface JsonStore {
  /**
   * Creates a record containing the provided json.
   *
   * @param json the record to store
   * @returns The resulting ID
   */
  put(json: string): Promise<string>

  /**
   * Gets the record with the provided ID if one exists.
   *
   * @param id the ID in question
   * @returns the record as a JSON string
   */
  get(id: string): Promise<string>

  /**
   * Deletes the record with the provided ID if one exists.
   *
   * @param id the ID in question
   * @returns true if there was a record to delete, false otherwise
   */
  del(id: string): Promise<boolean>
}
