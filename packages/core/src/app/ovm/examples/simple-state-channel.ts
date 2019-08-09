import uuid = require('uuid')

import {
  ONE,
  ZERO,
  Message,
  ParsedMessage,
  SignedMessage,
  StateChannelMessageDB,
  ImplicationProofItem,
  Decision,
  BigNumber,
} from '../../../types'
import {
  AddressBalance,
  deserializeBuffer,
  deserializeMessage,
  messageToBuffer,
  objectToBuffer,
  StateChannelExitClaim,
  StateChannelMessage,
  stateChannelMessageObjectDeserializer,
  stateChannelMessageToBuffer,
} from '../../serialization'
import {
  AndDecider,
  CannotDecideError,
  ForAllSuchThatDecider,
  NonceLessThanDecider,
} from '../deciders'
import { SignedByDecider } from '../deciders/signed-by-decider'
import { SignedByQuantifier } from '../quantifiers/signed-by-quantifier'

const signaturePlaceholder: Buffer = Buffer.from(
  'Trust me, this is totally signed.'
)

/**
 * Client responsible for State Channel communication
 */
class StateChannelClient {
  public constructor(
    private readonly messageDB: StateChannelMessageDB,
    private readonly signedByDecider: SignedByDecider,
    private readonly signedByQuantifier: SignedByQuantifier,
    private readonly myPrivateKey: Buffer,
    private readonly myAddress: Buffer
  ) {}

  /**
   * Creates a new Signed message with the provided balances on the channel that exists between
   * this address and the provided recipient address. If a channel does not exist, the resulting
   * SignedMessage will represent the first message in a new state channel.
   *
   * @param addressBalance The address balance for the message to create
   * @param recipient The address to send the SignedMessage to
   * @returns The SignedMessage if this client is able to create one
   */
  public async createNewMessage(
    addressBalance: AddressBalance,
    recipient: Buffer
  ): Promise<SignedMessage> {
    let channelId: Buffer = await this.messageDB.getChannelForCounterparty(
      recipient
    )
    let nonce: BigNumber

    if (!!channelId) {
      const [lastValid, lastSigned, exited]: [
        ParsedMessage,
        ParsedMessage,
        boolean
      ] = await Promise.all([
        this.messageDB.getMostRecentValidStateChannelMessage(channelId),
        this.messageDB.getMostRecentMessageSignedBy(channelId, this.myAddress),
        this.messageDB.isChannelExited(channelId),
      ])

      if (
        (!lastSigned && !lastValid) ||
        !lastSigned.message.nonce.equals(lastValid.message.nonce)
      ) {
        throw Error(
          'Cannot create new message when last message is not counter-signed'
        )
      }

      if (exited) {
        throw Error('Cannot create new message for exited channel.')
      }

      nonce = lastValid.message.nonce.add(ONE)
    } else {
      channelId = Buffer.from(uuid.v4())
      nonce = ONE
    }

    return this.signAndSaveMessage({
      sender: this.myAddress,
      recipient,
      message: {
        channelId,
        nonce,
        data: addressBalance,
      },
      signatures: {},
    })
  }

  /**
   * Exits the state channel with the provided counterparty.
   *
   * @param counterparty The address of the counterparty.
   * @returns The StateChannelClaim representing a valid exit claim for this channel.
   */
  public async exitChannel(
    counterparty: Buffer
  ): Promise<StateChannelExitClaim> {
    const channelId: Buffer = await this.messageDB.getChannelForCounterparty(
      counterparty
    )

    if (!channelId) {
      throw Error('Cannot exit a channel that does not exist.')
    }

    const mostRecent: ParsedMessage = await this.messageDB.getMostRecentValidStateChannelMessage(
      channelId
    )

    await this.messageDB.markChannelExited(channelId)

    return {
      decider: AndDecider.instance(),
      input: {
        left: {
          decider: this.signedByDecider,
          input: {
            message: messageToBuffer(
              mostRecent.message,
              stateChannelMessageToBuffer
            ),
            publicKey: this.myAddress,
          },
        },
        leftWitness: mostRecent.signatures[this.myAddress.toString()],
        right: {
          decider: ForAllSuchThatDecider.instance(),
          input: {
            quantifier: this.signedByQuantifier,
            quantifierParameters: this.myAddress,
            propertyFactory: (message: ParsedMessage) => {
              return {
                decider: NonceLessThanDecider.instance(),
                input: {
                  message,
                  nonce: mostRecent.message.nonce.add(ONE),
                },
              }
            },
          },
        },
        rightWitness: undefined,
      },
    }
  }

  /**
   * Handles a channel exit claim by validating it. If it can be disproven, it will return the
   * counter-claim that disproves it.
   *
   * TODO: Improve this signature
   * @param channelId the ChannelID in question
   * @param exitClaim the Exit claim in question
   * @returns the counter-claim that the original claim is invalid
   */
  public async handleChannelExit(
    channelId: Buffer,
    exitClaim: StateChannelExitClaim
  ): Promise<ImplicationProofItem[]> {
    let decision: Decision
    try {
      decision = await exitClaim.decider.decide(exitClaim.input)
    } catch (e) {
      if (!(e instanceof CannotDecideError)) {
        throw e
      }
    }

    if (!decision || decision.outcome) {
      await this.messageDB.markChannelExited(channelId)
      return undefined
    }

    return decision.justification
  }

  /**
   * Handles the provided SignedMessage and responds in the appropriate manner
   *
   * @param message The message to handle
   * @returns The response message, if one exists
   */
  public async handleMessage(message: SignedMessage): Promise<SignedMessage> {
    const parsedMessage: ParsedMessage = this.parseMessage(message)

    // Store message no matter what
    await this.messageDB.storeMessage(parsedMessage)

    const existingMessage: ParsedMessage = await this.messageDB.getMessageByChannelIdAndNonce(
      parsedMessage.message.channelId,
      parsedMessage.message.nonce
    )
    if (existingMessage) {
      await this.handleExistingMessage(parsedMessage, existingMessage)
      return undefined
    }

    if (parsedMessage.message.nonce.equals(ONE)) {
      return this.handleNewChannel(parsedMessage)
    }

    return this.handleNewMessage(parsedMessage)
  }

  /**
   * Handle the case when an address wants to create a new channel with this client.
   *
   * @param message The message to create the new channel
   * @return the SignedMessage countersigning the new channel creation if valid, undefined otherwise
   */
  private async handleNewChannel(
    message: ParsedMessage
  ): Promise<SignedMessage> {
    if (
      !this.validateStateChannelMessage(message) ||
      this.messageDB.channelIdExists(message.message.channelId)
    ) {
      // Not going to be a part of this channel
      return undefined
    }

    return this.signAndSaveMessage(message)
  }

  /**
   * Handles the case when we receive a message for a channel and nonce that we already
   * have a message for. This could be as simple as the counterparty countersigning or
   * it could be us and the counterparty sending a new message at the same time or some
   * unknown case.
   *
   * @param parsedMessage The new message
   * @param existingMessage The existing message
   */
  private async handleExistingMessage(
    parsedMessage: ParsedMessage,
    existingMessage: ParsedMessage
  ): Promise<void> {
    // TODO: Anything?
    // Either just a countersign or a conflicting message, but that's already accounted for in storeMessage(...)
  }

  /**
   * Handles a new message for an existing channel.
   *
   * @param message The new message in question
   * @returns The SignedMessage of the countersigned message or undefined if we're disputing this message
   */
  private async handleNewMessage(
    message: ParsedMessage
  ): Promise<SignedMessage> {
    if (!this.validateStateChannelMessage(message)) {
      return undefined
    }

    const [exited, conflicts, previousMessage]: [
      boolean,
      ParsedMessage,
      ParsedMessage
    ] = await Promise.all([
      this.messageDB.isChannelExited(message.message.channelId),
      this.messageDB.conflictsWithAnotherMessage(message),
      this.messageDB.getMostRecentValidStateChannelMessage(
        message.message.channelId
      ),
    ])
    if (!!conflicts || exited) {
      return undefined
    }

    // No previous message or this nonce is invalid
    if (
      !previousMessage ||
      previousMessage.message.nonce.gte(message.message.nonce)
    ) {
      return undefined
    }

    return this.signAndSaveMessage(message)
  }

  /**
   * Signs the provided message, stores it, and returns the signed message.
   * @param message The message to sign.
   * @returns The signed message.
   */
  private async signAndSaveMessage(
    message: ParsedMessage
  ): Promise<SignedMessage> {
    message.signatures[this.myAddress.toString()] = signaturePlaceholder

    await this.messageDB.storeMessage(message)

    return {
      sender: this.myAddress,
      signedMessage: objectToBuffer({
        channelId: message.message.channelId,
        nonce: message.message.nonce,
        data: stateChannelMessageToBuffer(message.message
          .data as StateChannelMessage),
      }),
    }
  }

  /**
   * Validates that the provided ParsedMessage wraps a valid StateChannelMessage.
   *
   * @param message The message to validate
   * @returns True if it is valid, false otherwise
   */
  private validateStateChannelMessage(message: ParsedMessage): boolean {
    try {
      const stateChannelMessage: StateChannelMessage = message.message
        .data as StateChannelMessage
      return (
        message.message.nonce.gte(ZERO) &&
        Object.keys(stateChannelMessage.addressBalance).length === 2 &&
        stateChannelMessage.addressBalance[this.myAddress.toString()].gte(
          ZERO
        ) &&
        stateChannelMessage.addressBalance[message.sender.toString()].gte(ZERO)
      )
    } catch (e) {
      return false
    }
  }

  /**
   * Parses the signed message into a ParsedMessage, if possible.
   * If not, it throws.
   *
   * @param signedMessage The signed message to parse.
   * @returns the resulting ParsedMessage.
   */
  private parseMessage(signedMessage: SignedMessage): ParsedMessage {
    // TODO: Would usually decrypt message based on sender key, but that part omitted for simplicity
    const message: Message = deserializeBuffer(
      signedMessage.signedMessage,
      deserializeMessage,
      stateChannelMessageObjectDeserializer
    )
    const signatures = {}
    signatures[signedMessage.sender.toString()] = signaturePlaceholder
    return {
      sender: signedMessage.sender,
      recipient: this.myAddress,
      message,
      signatures,
    }
  }
}
