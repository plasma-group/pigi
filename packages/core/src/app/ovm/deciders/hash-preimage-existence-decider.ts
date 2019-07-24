import { Decision } from '../../../types/ovm/decider.interface'
import { DB } from '../../../types/db'
import { DbDecider } from './db-decider'
import { CannotDecideError } from './utils'

export type HashFunction = (preimage: string) => string

export interface HashPreimageInput {
  hash: string
}

export interface HashPreimageWitness {
  preimage: string
}

/**
 * Decider that determines whether the provided witness is the preimage to the hash in question.
 */
export class HashPreimageExistenceDecider extends DbDecider {
  private static readonly UNIQUE_ID = 'HashPreimageDecider'

  private readonly hashFunction: HashFunction

  constructor(db: DB, hashFunction: HashFunction) {
    super(db)

    this.hashFunction = hashFunction
  }

  public async decide(
    input: HashPreimageInput,
    witness: HashPreimageWitness
  ): Promise<Decision> {
    const outcome = this.hashFunction(witness.preimage) === input.hash

    if (!outcome) {
      throw new CannotDecideError(
        `Preimage [${witness.preimage}] does not match hash [${input.hash}], so we cannot decide whether a preimage exists for the hash.`
      )
    }

    const decision: Decision = this.constructDecision(
      witness.preimage,
      outcome,
      input.hash
    )

    await this.storeDecision(
      input,
      HashPreimageExistenceDecider.serializeDecision(input, outcome, witness)
    )

    return decision
  }

  protected getUniqueId(): string {
    return HashPreimageExistenceDecider.UNIQUE_ID
  }

  protected deserializeDecision(decision: Buffer): Decision {
    const json: any[] = JSON.parse(decision.toString())
    return this.constructDecision(json[0], json[1], json[2])
  }

  /**
   * Builds a Decision from the provided hash, outcome, and preimage
   *
   * @param hash the hash for the Decision calculation
   * @param outcome the outcome of the Decision
   * @param preimage being tested
   * @returns the Decision
   */
  private constructDecision(
    hash: string,
    outcome: boolean,
    preimage: string
  ): Decision {
    return {
      outcome,
      implicationProof: [
        {
          implication: {
            decider: this,
            input: {
              hash,
            },
          },
          implicationWitness: {
            preimage,
          },
        },
      ],
    }
  }

  /**
   * Creates the buffer to be stored for a Decision
   *
   * @param input the input that led to the Decision
   * @param outcome the outcome of the Decision
   * @param witness the HashPreimageWitness
   * @returns the Buffer of the serialized data
   */
  private static serializeDecision(
    input: HashPreimageInput,
    outcome: boolean,
    witness: HashPreimageWitness
  ): Buffer {
    return Buffer.from(JSON.stringify([input.hash, outcome, witness.preimage]))
  }
}
