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
  StateChannelMessageDB,
  WitnessFactory,
} from '../../../../src/types/ovm'
import { ParsedMessage } from '../../../../src/types/serialization'

class TestMessageDB implements StateChannelMessageDB {
  private readonly exitedChannels: Set<string> = new Set()
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
      this.putConflict(potentialConflict)
      return
    }

    const channelId: Buffer = await this.getChannelForCounterparty(
      parsedMessage.sender.equals(this.myAddress)
        ? parsedMessage.recipient
        : parsedMessage.sender
    )

    if (channelId && !channelId.equals(parsedMessage.message.channelId)) {
      throw Error(
        'Cannot store message because at least one participant is not a part of the listed channel.'
      )
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
    return this.getConflict(channelId, nonce)
  }

  public async channelIdExists(channelId: Buffer): Promise<boolean> {
    for (const message of this.messageStore) {
      if (channelId.equals(message.message.channelId)) {
        return true
      }
    }
    return false
  }

  public async conflictsWithAnotherMessage(
    message: ParsedMessage
  ): Promise<ParsedMessage> {
    const conflict: ParsedMessage = this.getConflict(
      message.message.channelId,
      message.message.nonce
    )
    if (!!conflict) {
      return conflict
    }

    for (const msg of this.messageStore) {
      const storedConflict = this.getConflict(
        msg.message.channelId,
        msg.message.nonce
      )
      if (storedConflict.message.nonce.equals(message.message.nonce)) {
        return msg
      }
    }
  }

  public async getChannelForCounterparty(address: Buffer): Promise<Buffer> {
    for (const message of this.messageStore) {
      if (message.recipient.equals(address) || message.sender.equals(address)) {
        return message.message.channelId
      }
    }
  }

  public async getMostRecentMessageSignedBy(
    channelId: Buffer,
    address: Buffer
  ): Promise<ParsedMessage> {
    const addressString: string = address.toString()
    let mostRecent: ParsedMessage
    for (const message of this.messageStore) {
      if (
        message.message.channelId.equals(channelId) &&
        (!mostRecent || message.message.nonce.gt(mostRecent.message.nonce)) &&
        addressString in message.signatures
      ) {
        mostRecent = message
      }
    }
    return mostRecent
  }

  public async getMostRecentValidStateChannelMessage(
    channelId: Buffer
  ): Promise<ParsedMessage> {
    let mostRecent: ParsedMessage
    for (const message of this.messageStore) {
      if (
        message.message.channelId.equals(channelId) &&
        (!mostRecent || message.message.nonce.gt(mostRecent.message.nonce)) &&
        Object.keys(message.signatures).length === 2
      ) {
        mostRecent = message
      }
    }
    return mostRecent
  }

  public async isChannelExited(channelId: Buffer): Promise<boolean> {
    return this.exitedChannels.has(channelId.toString())
  }

  public async markChannelExited(channelId: Buffer): Promise<void> {
    this.exitedChannels.add(channelId.toString())
  }

  public getMyAddress(): Buffer {
    return this.myAddress
  }

  private getConflict(channelId: Buffer, nonce: BigNumber): ParsedMessage {
    const channelString: string = channelId.toString()
    const nonceString: string = nonce.toString()
    if (
      channelString in this.conflictingMessageStore &&
      nonceString in this.conflictingMessageStore[channelString]
    ) {
      return this.conflictingMessageStore[channelString][nonce]
    }
    return undefined
  }

  private putConflict(message: ParsedMessage): void {
    const channelString: string = message.message.channelId.toString()
    const nonceString: string = message.message.nonce.toString()
    if (!(channelString in this.conflictingMessageStore)) {
      this.conflictingMessageStore[channelString] = {}
    }
    this.conflictingMessageStore[channelString][nonceString] = message
  }
}

describe('State Channel Tests', () => {
  // TODO: Some really sweet tests
})
