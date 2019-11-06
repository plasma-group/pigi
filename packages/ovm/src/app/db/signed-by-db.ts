/* External Imports */
import {
  Logger,
  getLogger,
  Md5Hash,
  SignatureVerifier,
  Secp256k1SignatureVerifier,
  serializeObject,
  deserializeObject,
} from '@pigi/core-utils'
import { DB } from '@pigi/core-db'

/* Internal Imports */
import { SignedByDBInterface } from '../../types/db/signed-by-db'
import { SignedMessage } from '../../types/serialization'

const log: Logger = getLogger('signed-by-db')

/**
 * DB to store and access message signatures.
 */
export class SignedByDB implements SignedByDBInterface {
  public constructor(
    private readonly db: DB,
    private readonly singatureVerifier: SignatureVerifier = Secp256k1SignatureVerifier.instance()
  ) {}

  public async handleMessage(
    serializedMessage: string,
    signature?: string
  ): Promise<void> {
    if (!!signature) {
      try {
        await this.storeSignedMessage(serializedMessage, signature)
      } catch (e) {
        log.debug(
          `Received a message that cannot be parsed. Ignoring. Message: ${serializedMessage}, error: ${e.message}, stack: ${e.stack}`
        )
      }
    }
  }

  public async storeSignedMessage(
    serializedMessage: string,
    signature: string
  ): Promise<void> {
    const signerPublicKey = await this.singatureVerifier.verifyMessage(
      serializedMessage,
      signature
    )

    const serializedRecord: Buffer = SignedByDB.serializeRecord({
      signature,
      serializedMessage,
    })

    await this.db
      .bucket(Buffer.from(signerPublicKey))
      .put(SignedByDB.getKey(serializedMessage), serializedRecord)
  }

  public async getMessageSignature(
    serializedMessage: string,
    signerPublicKey: string
  ): Promise<string | undefined> {
    const recordBuffer: Buffer = await this.db
      .bucket(Buffer.from(signerPublicKey))
      .get(SignedByDB.getKey(serializedMessage))

    if (!recordBuffer) {
      return undefined
    }

    return SignedByDB.deserializeRecord(recordBuffer).signature
  }

  public async getAllSignedBy(
    signerPublicKey: string
  ): Promise<SignedMessage[]> {
    const signed: Buffer[] = await this.db
      .bucket(Buffer.from(signerPublicKey))
      .iterator()
      .values()

    return signed.map((m) => SignedByDB.deserializeRecord(m))
  }

  private static getKey(message: string): Buffer {
    return Buffer.from(Md5Hash(message))
  }

  private static serializeRecord(signedMessage: SignedMessage): Buffer {
    return Buffer.from(serializeObject(signedMessage))
  }

  private static deserializeRecord(serialized: Buffer): SignedMessage {
    const obj: {} = deserializeObject(serialized.toString())
    return {
      signature: obj['signature'],
      serializedMessage: obj['serializedMessage'],
    }
  }
}
