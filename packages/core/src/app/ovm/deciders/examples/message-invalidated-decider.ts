import { Decision, MessageDB } from '../../../../types/ovm'
import { DB } from '../../../../types/db'
import { CannotDecideError } from '../utils'
import { KeyValueStoreDecider } from '../key-value-store-decider'
import { ParsedMessage } from '../../../../types/serialization'
import { objectsEqual, ONE } from '../../../utils'
import { StateChannelMessage } from '../../../serialization/examples'
import { Utils } from './utils'

export interface MessageInvalidatedInput {
  message: ParsedMessage
}

export interface MessageInvalidatedWitness {
  invalidatingMessage: ParsedMessage
}

/**
 * Decider that determines whether the provided State Channel Message has been invalidated.
 */
export class MessageInvalidatedDecider extends KeyValueStoreDecider {
  private static readonly UNIQUE_ID = 'MessageInvalidatedDecider'

  private readonly messageDB: MessageDB

  constructor(db: DB, messageDB: MessageDB) {
    super(db)

    this.messageDB = messageDB
  }

  protected async makeDecision(
    input: MessageInvalidatedInput,
    witness: MessageInvalidatedWitness
  ): Promise<Decision> {
    let outcome: boolean = false

    if (
      input.message.message.channelId.equals(
        witness.invalidatingMessage.message.channelId
      )
    ) {
      outcome =
        this.messageInvalidates(witness.invalidatingMessage, input.message) ||
        Utils.messagesConflict(input.message, witness.invalidatingMessage)
    }

    if (!outcome) {
      throw new CannotDecideError(
        `The message [${JSON.stringify(
          input.message
        )}] is not invalidated by or conflicted by [${JSON.stringify(
          witness.invalidatingMessage
        )}], so we cannot decide whether or not it has been invalided.`
      )
    }

    // TODO: store the decision

    return this.constructDecision(
      input.message,
      witness.invalidatingMessage,
      outcome
    )
  }

  protected getUniqueId(): string {
    return MessageInvalidatedDecider.UNIQUE_ID
  }

  protected deserializeDecision(decision: Buffer): Decision {
    // TODO: this when decisions are stored
    return undefined
  }

  /**
   * Determines whether or not the provided ParsedMessage invalidates the other provided ParsedMessage.
   *
   * @param invalidating
   * @param invalid
   */
  private messageInvalidates(
    invalidating: ParsedMessage,
    invalid: ParsedMessage
  ): boolean {
    const counterpartyAddress: Buffer = this.getCounterpartyAddress(invalid)

    const invalidatingStateChannelMessage: StateChannelMessage = invalidating
      .message.data as StateChannelMessage
    return (
      invalidatingStateChannelMessage.invalidatesNonce.equals(
        invalid.message.nonce
      ) && counterpartyAddress.toString() in invalidating.signatures
    )
  }

  /**
   * Builds a Decision from the provided ParsedMessage
   *
   * @param message The message that was invalidated (or not)
   * @param invalidatingMessage The message that invalidates the message
   * @param outcome the outcome of the Decision
   * @returns the Decision
   */
  private constructDecision(
    message: ParsedMessage,
    invalidatingMessage: ParsedMessage,
    outcome: boolean
  ): Decision {
    return {
      outcome,
      justification: [
        {
          implication: {
            decider: this,
            input: {
              message,
            },
          },
          implicationWitness: {
            invalidatingMessage,
          },
        },
      ],
    }
  }

  private getCounterpartyAddress(message: ParsedMessage): Buffer {
    return this.messageDB.getMyAddress().equals(message.sender)
      ? message.recipient
      : message.sender
  }
}
