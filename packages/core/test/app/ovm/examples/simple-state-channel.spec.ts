import '../../../setup'

import MemDown from 'memdown'

import {
  ForAllSuchThatDecider,
  ForAllSuchThatInput,
  HashPreimageExistenceDecider,
  Utils,
} from '../../../../src/app/ovm/deciders'
import { BaseDB } from '../../../../src/app/db'
import { BigNumber, Md5Hash, objectsEqual } from '../../../../src/app/utils'
import { DB } from '../../../../src/types/db'
import { IntegerRangeQuantifier } from '../../../../src/app/ovm/quantifiers'
import {
  Decision,
  MessageDB,
  PropertyFactory,
  WitnessFactory,
} from '../../../../src/types/ovm'
import { ParsedMessage } from '../../../../src/types/serialization'

class TestMessageDB implements MessageDB {
  private readonly conflictingMessageStore: {} = {}
  private readonly messageStore: ParsedMessage[] = []

  public constructor(private readonly myAddress: Buffer) {}

  public async storeMessage(parsedMessage: ParsedMessage): Promise<void> {
    // Check if conflict, and if so, store separately
    const potentialConflict: ParsedMessage = await this.getMessageByChannelIdAndNonce(
      parsedMessage.message.channelId,
      parsedMessage.message.nonce
    )
    if (Utils.messagesConflict(potentialConflict, parsedMessage)) {
      this.storeConflictingMessage(potentialConflict)
      return
    }

    for (let i = 0; i < this.messageStore.length; i++) {
      const parsedMsg: ParsedMessage = this.messageStore[i]
      if (
        parsedMsg.message.channelId.equals(parsedMessage.message.channelId) &&
        parsedMsg.sender.equals(parsedMessage.sender) &&
        parsedMsg.recipient.equals(parsedMessage.recipient) &&
        objectsEqual(parsedMsg.message, parsedMessage.message) &&
        ((!parsedMsg.message.nonce && !parsedMessage.message.nonce) ||
          (parsedMsg.message.nonce &&
            parsedMessage.message.nonce &&
            parsedMsg.message.nonce.eq(parsedMessage.message.nonce)))
      ) {
        this.messageStore[i] = parsedMessage
        break
      }
    }

    this.messageStore.push(parsedMessage)
  }

  public async getMessageByChannelIdAndNonce(
    channelId: Buffer,
    nonce: BigNumber
  ): Promise<ParsedMessage> {
    for (const parsedMsg of this.messageStore) {
      if (
        parsedMsg.message.channelId.equals(channelId) &&
        parsedMsg.message.nonce &&
        parsedMsg.message.nonce.eq(nonce)
      ) {
        return parsedMsg
      }
    }
    return undefined
  }

  public async getMessagesByRecipient(
    recipient: Buffer,
    channelId?: Buffer,
    nonce?: BigNumber
  ): Promise<ParsedMessage[]> {
    // passes back live references to messages, but that doesn't matter for these tests.
    const messages = []
    for (const parsedMsg of this.messageStore) {
      if (
        parsedMsg.recipient.equals(recipient) &&
        (!channelId || parsedMsg.message.channelId.equals(channelId)) &&
        (!nonce ||
          (parsedMsg.message.nonce && parsedMsg.message.nonce.eq(nonce)))
      ) {
        messages.push(parsedMsg)
      }
    }

    return messages
  }

  public async getMessagesBySender(
    sender: Buffer,
    channelId?: Buffer,
    nonce?: BigNumber
  ): Promise<ParsedMessage[]> {
    // passes back live references to messages, but that doesn't matter for these tests.
    const messages = []
    for (const msg of this.messageStore) {
      if (
        msg.sender.equals(sender) &&
        (!channelId || msg.message.channelId.equals(channelId)) &&
        (!nonce || (msg.message.nonce && msg.message.nonce.eq(nonce)))
      ) {
        messages.push(msg)
      }
    }

    return messages
  }

  public async getMessagesSignedBy(
    signer: Buffer,
    channelId?: Buffer,
    nonce?: BigNumber
  ): Promise<ParsedMessage[]> {
    // passes back live references to messages, but that doesn't matter for these tests.
    const messages = []
    for (const parsedMsg of this.messageStore) {
      if (
        TestMessageDB.messageSignedBy(parsedMsg, signer) &&
        (!channelId || parsedMsg.message.channelId.equals(channelId)) &&
        (!nonce ||
          (parsedMsg.message.nonce && parsedMsg.message.nonce.eq(nonce)))
      ) {
        messages.push(parsedMsg)
      }
    }

    return messages
  }

  private static messageSignedBy(
    message: ParsedMessage,
    signer: Buffer
  ): boolean {
    const signerAddress: string = signer.toString()
    for (const [address, signature] of Object.entries(message.signatures)) {
      if (address === signerAddress) {
        // TODO: would check signature, but not right now
        return true
      }
    }
    return false
  }

  public async getConflictingCounterpartyMessage(
    channelId: Buffer,
    nonce: BigNumber
  ): Promise<ParsedMessage> {
    const chan: string = channelId.toString()
    const non: string = nonce.toString()
    if (
      chan in this.conflictingMessageStore &&
      non in this.conflictingMessageStore[chan]
    ) {
      return this.conflictingMessageStore[chan][non]
    }
    return undefined
  }

  public getMyAddress(): Buffer {
    return this.myAddress
  }

  private storeConflictingMessage(message: ParsedMessage): void {
    const chan: string = message.message.channelId.toString()
    const non: string = message.message.nonce.toString()
    if (!(chan in this.conflictingMessageStore)) {
      this.conflictingMessageStore[chan] = {}
    }
    this.conflictingMessageStore[chan][non] = message
  }
}

describe('State Channel Tests', () => {
  // TODO: Some really sweet tests
})
