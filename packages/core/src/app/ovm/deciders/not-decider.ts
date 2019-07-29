import {
  Decider,
  Decision,
  ImplicationProofItem,
  Property,
} from '../../../types/ovm'

export interface NotDeciderInput {
  property: Property
  witness: any
}

/**
 * Decider that decides true iff the provided property evaluates to false.
 */
export class NotDecider implements Decider {
  public async decide(
    input: NotDeciderInput,
    witness: undefined
  ): Promise<Decision> {
    const decision: Decision = await input.property.decider.decide(
      input.property.input,
      input.witness
    )

    return this.getDecision(input, decision)
  }

  public async checkDecision(input: NotDeciderInput): Promise<Decision> {
    return this.decide(input, undefined)
  }

  private getDecision(input: NotDeciderInput, subDecision: Decision): Decision {
    const justification: ImplicationProofItem[] = [
      {
        implication: {
          decider: this,
          input,
        },
        implicationWitness: undefined,
      },
      ...subDecision.justification,
    ]

    return {
      outcome: !subDecision.outcome,
      justification,
    }
  }
}
