import { SignedByDbInterface } from '../../../types/ovm/db/signed-by-db.interface'
import { MessageSubscriber } from '../../../types/ovm/message-subscriber.interface'
import { Message, SignedMessage } from '../../../types/serialization'
import { DB } from '../../../types/db'
import { decryptWithPublicKey, Md5Hash } from '../../utils'

interface Record {
  signerPublicKey: Buffer
  signature: Buffer
  message: Buffer
}

/**
 * DB to store and access message signatures.
 */
export class SignedByDb implements SignedByDbInterface, MessageSubscriber {
  public constructor(private readonly db: DB) {}

  public async handleMessage(
    message: Message,
    signedMessage?: SignedMessage
  ): Promise<void> {
    if (!!signedMessage) {
      await this.storeSignedMessage(
        signedMessage.signedMessage,
        signedMessage.sender
      )
    }
  }

  public async storeSignedMessage(
    signature: Buffer,
    signerPublicKey: Buffer
  ): Promise<void> {
    const message: Buffer = decryptWithPublicKey(
      signerPublicKey,
      signature
    ) as Buffer
    const serialized: Buffer = SignedByDb.serializeRecord({
      signerPublicKey,
      signature,
      message,
    })

    await this.db
      .bucket(signerPublicKey)
      .put(SignedByDb.getKey(message), serialized)
  }

  public async getMessageSignature(
    message: Buffer,
    signerPublicKey
  ): Promise<Buffer | undefined> {
    const recordBuffer: Buffer = await this.db
      .bucket(signerPublicKey)
      .get(SignedByDb.getKey(message))

    if (!recordBuffer) {
      return undefined
    }

    return SignedByDb.deserializeRecord(recordBuffer).signature
  }

  private static getKey(message: Buffer): Buffer {
    return Md5Hash(message)
  }

  private static serializeRecord(record: Record): Buffer {
    return Buffer.from(
      JSON.stringify({
        signerPublicKey: record.signerPublicKey.toString(),
        signature: record.signature.toString(),
        message: record.message.toString(),
      })
    )
  }

  private static deserializeRecord(serialized: Buffer): Record {
    const obj: {} = JSON.parse(serialized.toString())
    return {
      signerPublicKey: Buffer.from(obj['signerPublicKey']),
      signature: Buffer.from(obj['signature']),
      message: Buffer.from(obj['message']),
    }
  }
}
