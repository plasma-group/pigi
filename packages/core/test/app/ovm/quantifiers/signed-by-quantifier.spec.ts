import '../../../setup'

import * as assert from 'assert'
import {
  Message,
  MessageDB,
} from '../../../../src/types/ovm/db/message-db.interface'
import { BigNumber } from '../../../../src/types/number'
import { SignedByQuantifier } from '../../../../src/app/ovm/quantifiers/signed-by-quantifier'
import { QuantifierResult } from '../../../../src/types/ovm'

/*******************
 * Mocks & Helpers *
 *******************/

class MockedMessageDB implements MessageDB {
  public async del(id: string): Promise<boolean> {
    return undefined
  }

  public async get(id: string): Promise<string> {
    return undefined
  }

  public async put(json: string): Promise<string> {
    return undefined
  }

  public async getMessageByChannelIdAndNonce(
    channelId: Buffer,
    nonce: BigNumber
  ): Promise<Message> {
    return undefined
  }

  public async getMessagesByRecipient(
    address: Buffer,
    channelId?: Buffer,
    nonce?: BigNumber
  ): Promise<Message[]> {
    return undefined
  }

  public async getMessagesBySender(
    address: Buffer,
    channelId?: Buffer,
    nonce?: BigNumber
  ): Promise<Message[]> {
    return undefined
  }

  public async getMessagesSignedBy(
    signer: Buffer,
    channelId?: Buffer,
    nonce?: BigNumber
  ): Promise<Message[]> {
    return undefined
  }
}

const getMessageDBThatReturns = (messages: Message[]): MockedMessageDB => {
  const db: MockedMessageDB = new MockedMessageDB()
  db.getMessagesSignedBy = async (
    signer: Buffer,
    channelId?: Buffer,
    nonce?: BigNumber
  ) => messages
  return db
}

/*********
 * TESTS *
 *********/

describe('SignedByQuantifier', () => {
  describe('getAllQuantified', () => {
    const myAddress: Buffer = Buffer.from('0xMY_ADDRESS =D')
    const notMyAddress: Buffer = Buffer.from('0xNOT_MY_ADDRESS =|')

    it('Returns messages from the DB with my address', async () => {
      const message1: Message = {
        channelId: Buffer.from('channel'),
        sender: Buffer.from('sender'),
        recipient: Buffer.from('recipient'),
        signers: [myAddress],
        message: undefined,
        signedMessage: undefined,
      }

      const message2: Message = {
        channelId: Buffer.from('channel'),
        sender: Buffer.from('sender'),
        recipient: Buffer.from('recipient'),
        signers: [myAddress],
        message: undefined,
        signedMessage: undefined,
      }
      const messages: Message[] = [message1, message2]
      const db: MockedMessageDB = getMessageDBThatReturns(messages)
      const quantifier: SignedByQuantifier = new SignedByQuantifier(
        db,
        myAddress
      )

      const result: QuantifierResult = await quantifier.getAllQuantified({
        address: myAddress,
      })
      result.allResultsQuantified.should.equal(true)
      result.results.length.should.equal(2)
      result.results[0].should.equal(message1)
      result.results[1].should.equal(message2)
    })
  })
})
