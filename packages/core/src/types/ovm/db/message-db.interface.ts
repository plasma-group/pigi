import { JsonStore } from '../../db/json-db.interface'
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

export interface MessageDB extends JsonStore {
  getMessageByChannelIdAndNonce(
    channelId: Buffer,
    nonce: BigNumber
  ): Promise<Message>

  getMessagesSignedBy(
    signer: Buffer,
    channelId?: Buffer,
    nonce?: BigNumber
  ): Promise<Message[]>

  getMessagesBySender(
    address: Buffer,
    channelId?: Buffer,
    nonce?: BigNumber
  ): Promise<Message[]>

  getMessagesByRecipient(
    address: Buffer,
    channelId?: Buffer,
    nonce?: BigNumber
  ): Promise<Message[]>
}
