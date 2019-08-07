import {
  ONE,
  Property,
  ZERO,
  MessageDB,
  Message,
  ParsedMessage,
  SignedMessage,
} from '../../../types'
import {
  AddressBalance,
  deserializeBuffer,
  deserializeMessage,
  objectToBuffer,
  StateChannelMessage,
  stateChannelMessageObjectDeserializer,
  stateChannelMessageToBuffer,
} from '../../serialization'
import { Utils } from '../deciders/examples'

const signaturePlaceholder: Buffer = Buffer.from(
  'Trust me, this is totally signed.'
)

class StateChannelClient {
  public constructor(
    private readonly messageDB: MessageDB,
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
    // TODO: this
    return undefined
  }

  /**
   * Handles the provided SignedMessage and responds in the appropriate manner
   *
   * @param message The message to handle
   * @returns The response message, if one exists
   */
  public async handleMessage(message: SignedMessage): Promise<SignedMessage> {
    const parsedMessage: ParsedMessage = this.parseMessage(message)

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
    // Store message no matter what
    await this.messageDB.storeMessage(message)

    if (!message.message.nonce.eq(ONE)) {
      throw Error('Cannot start channel with nonce != 1')
    }

    if (!this.validateStateChannelMessage(message)) {
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
    if (Utils.messagesConflict(parsedMessage, existingMessage)) {
      // I cannot sign this message, this message and my conflicting message are now void
      await this.messageDB.storeMessage(parsedMessage)
    }

    if (this.myAddress.toString() in parsedMessage.signatures) {
      // TODO: check my signature to make sure it's still valid
      await this.messageDB.storeMessage(parsedMessage)
    }

    // TODO: We want to store this message so we know about it later
    return undefined
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
    const previousMessage: ParsedMessage = await this.messageDB.getMessageByChannelIdAndNonce(
      message.message.channelId,
      message.message.nonce.sub(ONE)
    )
    if (
      !previousMessage ||
      Object.keys(previousMessage.signatures).length !== 2
    ) {
      await this.messageDB.storeMessage(message)
      // TODO: Build Not SignedByDecider claim for the message before this one and my address
      await this.disputeMessage(message, undefined, undefined)
      return undefined
    }

    if (this.validateStateChannelMessage(message)) {
      return this.signAndSaveMessage(message)
    }

    return undefined
  }

  private async disputeMessage(
    message: ParsedMessage,
    claim: Property,
    witness: any
  ): Promise<void> {
    // TODO: build dispute that will dispute StateChannelClaim
    return
  }

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

  private validateStateChannelMessage(message: ParsedMessage): boolean {
    try {
      const stateChannelMessage: StateChannelMessage = message.message
        .data as StateChannelMessage
      return (
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
