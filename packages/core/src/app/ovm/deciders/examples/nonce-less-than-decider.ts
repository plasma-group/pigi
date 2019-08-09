import { Decider, Decision, ImplicationProofItem } from '../../../../types/ovm'
import { ParsedMessage } from '../../../../types/serialization'
import { BigNumber } from '../../../utils'

export interface NonceLessThanInput {
  message: ParsedMessage
  nonce: BigNumber
}

/**
 * Decider that decides true iff the input message has a nonce less than the input nonce.
 */
export class NonceLessThanDecider implements Decider {
  private static _instance: NonceLessThanDecider
  public static instance(): NonceLessThanDecider {
    if (!NonceLessThanDecider._instance) {
      NonceLessThanDecider._instance = new NonceLessThanDecider()
    }
    return NonceLessThanDecider._instance
  }

  public async decide(
    input: NonceLessThanInput,
    witness: undefined,
    noCache?: boolean
  ): Promise<Decision> {
    const justification: ImplicationProofItem[] = [
      {
        implication: {
          decider: this,
          input,
        },
        implicationWitness: witness,
      },
    ]

    return {
      outcome: input.message.message.nonce.lt(input.nonce),
      justification,
    }
  }
}
