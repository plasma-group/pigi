import {
  Decider,
  Decision,
  ImplicationProofItem,
  Property,
  PropertyFactory,
  Quantifier,
  QuantifierResult,
} from '../../../types/ovm'
import { CannotDecideError } from './utils'

export interface ForAllSuchThatInput {
  quantifier: Quantifier
  quantifierParameters: any
  propertyFactory: PropertyFactory
}

/**
 * Decider that decides true iff the provided quantifier quantifies all results and they all evaluate to true.
 * If any evaluates to false, it will decide false. Otherwise, it is undecidable.
 */
export class ForAllSuchThatDecider implements Decider {
  public async decide(
    input: ForAllSuchThatInput,
    witness: undefined
  ): Promise<Decision> {
    const quantifierResult: QuantifierResult = await input.quantifier.getAllQuantified(
      input.quantifierParameters
    )

    let anyUndecided: boolean = false
    let falseDecision: Decision
    for (const res of quantifierResult.results) {
      const prop: Property = input.propertyFactory(res)
      try {
        const decision: Decision = await prop.decider.decide(input, undefined)
        if (!decision.outcome) {
          falseDecision = decision
          break
        }
      } catch (e) {
        if (e instanceof CannotDecideError) {
          anyUndecided = true
        } else {
          throw e
        }
      }
    }

    return this.getDecision(
      input,
      falseDecision,
      anyUndecided || !quantifierResult.allResultsQuantified
    )
  }

  public async checkDecision(input: ForAllSuchThatInput): Promise<Decision> {
    return this.decide(input, undefined)
  }

  /**
   * Gets the Decision that results from invocation of the ForAllSuchThat Decider.
   *
   * @param input The input that led to the Decision
   * @param falseDecision A [possibly undefined] Decision failing this Decider to be used as proof
   * @param undecided Whether or not some results of this Decider are undecided
   * @returns The Decision.
   */
  private getDecision(
    input: ForAllSuchThatInput,
    falseDecision: Decision,
    undecided: boolean
  ): Decision {
    if (!falseDecision && undecided) {
      throw new CannotDecideError(
        'Cannot decide ForAllSuchThat due to undecided Decision or not all results being quantified.'
      )
    }
    const justification: ImplicationProofItem[] = [
      {
        implication: {
          decider: this,
          input,
        },
        implicationWitness: undefined,
      },
    ]

    if (!!falseDecision) {
      justification.push(...falseDecision.justification)
    }

    return {
      outcome: !falseDecision,
      justification,
    }
  }
}
