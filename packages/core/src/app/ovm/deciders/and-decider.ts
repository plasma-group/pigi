import {
  Decider,
  Decision,
  ImplicationProofElement,
  Property,
} from '../../../types/ovm/decider.interface'

export interface AndDeciderInput {
  left: Property
  leftWitness: any
  right: Property
  rightWitness: any
}

/**
 * Decider that decides true iff both of the provided properties evaluate to true.
 */
export class AndDecider implements Decider {
  public async decide(
    input: AndDeciderInput,
    witness: undefined
  ): Promise<Decision> {
    const [leftDecision, rightDecision] = await Promise.all([
      input.left.decider.decide(input.left.input, input.leftWitness),
      input.right.decider.decide(input.right.input, input.rightWitness),
    ])

    if (!leftDecision.outcome) {
      return leftDecision
    }
    if (!rightDecision.outcome) {
      return rightDecision
    }

    const justification: ImplicationProofElement[] = []
    if (!!leftDecision.justification.length) {
      justification.concat(leftDecision.justification)
    }
    if (!!rightDecision.justification.length) {
      justification.concat(rightDecision.justification)
    }

    return {
      outcome: true,
      justification,
    }
  }

  public async checkDecision(input: AndDeciderInput): Promise<Decision> {
    return this.decide(input, undefined)
  }
}
