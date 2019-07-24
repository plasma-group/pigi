import { Md5 } from 'ts-md5/dist/md5'

import { Decider, Decision } from '../../../types/ovm/decider.interface'
import { Bucket, DB } from '../../../types/db'

export abstract class DbDecider implements Decider {
  private readonly decisionBucket: Bucket

  protected constructor(db: DB) {
    this.decisionBucket = db.bucket(Buffer.from(this.getUniqueId()))
  }

  public async checkDecision(input: any): Promise<Decision> {
    const hash: Buffer = DbDecider.getCacheKey(input)
    const decisionBuffer: Buffer = await this.decisionBucket.get(hash)

    if (decisionBuffer === null) {
      return undefined
    }

    return this.deserializeDecision(decisionBuffer)
  }

  /**
   * Stores the provided decision for the provided input.
   *
   * @param input the input that resulted in the provided decision
   * @param serializedDecision the buffer representing the Decision to be stored
   */
  protected async storeDecision(
    input: any,
    serializedDecision: Buffer
  ): Promise<void> {
    const key: Buffer = DbDecider.getCacheKey(input)

    await this.decisionBucket.put(key, serializedDecision)
  }

  /**
   * Gets the unique key for the provided input to use as a cache key for its Decisions
   *
   * @param input the input for which a key will be computed
   * @returns the computed cache key
   */
  private static getCacheKey(input: any): Buffer {
    return Buffer.from(Md5.hashStr(JSON.stringify(input)) as string)
  }

  /********************
   * ABSTRACT METHODS *
   ********************/

  public abstract decide(_input: any, _witness: any): Promise<Decision>

  /**
   * Returns the unique ID of this Decider.
   *
   * This is used to identify this Decider in storage and serialization / deserialization
   * @returns the unique ID
   */
  protected abstract getUniqueId(): string

  /**
   * Deserializes the provided Decision Buffer into the object it represents.
   *
   * @param decision the Buffer to deserialize into a Decision
   * @returns the deserialized Decision
   */
  protected abstract deserializeDecision(decision: Buffer): Decision
}
