import {
  Decider,
  Decision,
  Property,
} from '../../../types/ovm/decider.interface'

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

    if (!decision) {
      decision.outcome = true
      return decision
    }

    decision.outcome = false
    return decision
  }

  public async checkDecision(input: NotDeciderInput): Promise<Decision> {
    return this.decide(input, undefined)
  }
}
