/* External Imports */
import { Service } from '@nestd/core'
import { stringify, jsonify } from '../utils'
import { KeyNotFoundException } from '../exceptions'

/**
 * Service used for storing configuration for other services.
 */
@Service()
export class ConfigService {
  private db = new Map<string, string>()

  /**
   * Queries a value from the config.
   * @param key Key to query.
   * @returns the config value.
   */
  public get(key: string): any {
    if (!this.db.has(key)) {
      throw new KeyNotFoundException(key, 'config')
    }

    const value = this.db.get(key)
    return jsonify(value)
  }

  /**
   * Sets a value in the config.
   * @param key Key to set.
   * @param value Value to set.
   */
  public set(key: string, value: any): void {
    const parsed = stringify(value)
    this.db.set(key, parsed)
  }
}
