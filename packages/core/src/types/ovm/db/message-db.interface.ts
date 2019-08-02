import { BigNumber } from '../../number'

export interface Message {
  channelId: Buffer
  sender: Buffer
  recipient: Buffer
  nonce?: BigNumber
  signers: Buffer[]
  message: any
  signedMessage: any
}

export interface MessageDB {
  /**
   * Gets a specific message by the provided channel ID and nonce.
   *
   * @param channelId the channel ID in question
   * @param nonce the nonce in question
   * @returns The message, if there is one
   */
  getMessageByChannelIdAndNonce(
    channelId: Buffer,
    nonce: BigNumber
  ): Promise<Message>

  /**
   * Gets all messages signed by the provided signer address.
   *
   * @param signer the signer address to filter by
   * @param channelId an optional channelId to filter by
   * @param nonce an optional nonce to filter by
   * @returns the list of Messages that match the provided filters
   */
  getMessagesSignedBy(
    signer: Buffer,
    channelId?: Buffer,
    nonce?: BigNumber
  ): Promise<Message[]>

  /**
   * Gets all messages by the provided sender address.
   *
   * @param sender the sender address to filter by
   * @param channelId an optional channelId to filter by
   * @param nonce an optional nonce to filter by
   * @returns the list of Messages that match the provided filters
   */
  getMessagesBySender(
    sender: Buffer,
    channelId?: Buffer,
    nonce?: BigNumber
  ): Promise<Message[]>

  /**
   * Gets all messages by the provided recipient address.
   *
   * @param recipient the recipient address to filter by
   * @param channelId an optional channelId to filter by
   * @param nonce an optional nonce to filter by
   * @returns the list of Messages that match the provided filters
   */
  getMessagesByRecipient(
    recipient: Buffer,
    channelId?: Buffer,
    nonce?: BigNumber
  ): Promise<Message[]>
}
