import { Decider, Decision, ImplicationProofItem } from '../../../../types/ovm'
import { ParsedMessage } from '../../../../types/serialization'
import { objectsEqual } from '../../../utils'

export interface MessageEqualsInput {
  message: ParsedMessage
}

export interface MessageEqualsWitness {
  message: ParsedMessage
}

/**
 * Decider that decides true iff the input and the witness represent the same State Channel Message
 */
export class MessageEqualsDecider implements Decider {
  public async decide(
    input: MessageEqualsInput,
    witness: MessageEqualsWitness,
    noCache?: boolean
  ): Promise<Decision> {
    const outcome: boolean = MessageEqualsDecider.messagesAreEqual(
      input.message,
      witness.message
    )

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
      outcome,
      justification,
    }
  }

  /**
   * Determines whether or not the provided ParsedMessage represent the same State Channel Message.
   *
   * @param message The first message
   * @param other The second message
   */
  private static messagesAreEqual(
    message: ParsedMessage,
    other: ParsedMessage
  ): boolean {
    return (
      message.sender === other.sender &&
      message.recipient === other.recipient &&
      message.message.channelId === other.message.channelId &&
      message.message.nonce === other.message.nonce &&
      objectsEqual(message.message.data, other.message.data)
    )
  }
}
