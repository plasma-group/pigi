export interface ProofItem {
  property: Property
  witness: {}
}

export type Proof = ProofItem[]

export interface Property {
  decider: Decider
  input: {}
}

export type PropertyFactory = (input: any) => Property
export type WitnessFactory = (input: any) => any

export interface ImplicationProofItem {
  implication: Property
  implicationWitness: any
}

export interface Decision {
  outcome: boolean
  justification: ImplicationProofItem[] // constructed such that claim[N] --> claim[N-1] --> claim[N-2]... Claim[0]
}

/**
 * Defines the Decider interface that implementations capable of making decisions
 * on the provided input according to the logic of the specific implementation.
 *
 * For example: A PreimageExistsDecider would be able to make decisions on whether
 * or not the provided witness, when hashed, results in the provided input.
 */
export interface Decider {
  /**
   * Makes a Decision on the provided input.
   * @param input The input on which a decision is being made
   * @param witness The evidence for the decision
   * @param cached Whether or not the caller allows a cached result
   */
  decide(input: any, witness: any, cached: boolean): Promise<Decision>

  /**
   * Checks whether or not a decision has been made for the provided Input
   * Note: This should access a cache decisions that have been made
   * @param input The input on which a decision is being made
   * @returns the Decision that was made, if one was made.
   */
  checkDecision(input: any): Promise<Decision>
}
