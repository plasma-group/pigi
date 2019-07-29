import {
  Decider,
  Decision,
  ImplicationProofItem,
  Property,
} from '../../../types/ovm'

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
      return this.getDecision(input, leftDecision)
    }
    if (!rightDecision.outcome) {
      return this.getDecision(input, rightDecision)
    }

    const justification: ImplicationProofItem[] = []
    if (!!leftDecision.justification.length) {
      justification.concat(leftDecision.justification)
    }
    if (!!rightDecision.justification.length) {
      justification.concat(rightDecision.justification)
    }

    return this.getDecision(input, { outcome: true, justification })
  }

  public async checkDecision(input: AndDeciderInput): Promise<Decision> {
    return this.decide(input, undefined)
  }

  private getDecision(input: AndDeciderInput, subDecision: Decision): Decision {
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
      outcome: subDecision.outcome,
      justification,
    }
  }
}
