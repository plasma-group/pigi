import { MessageSubscriber } from '../message-subscriber.interface'

export interface SignedByDbInterface extends MessageSubscriber {
  /**
   * Stores the signature for the provided signer.
   *
   * @param signature The signature of the signer signing the
   * @param signerPublicKey The public key of the signer
   */
  storeSignedMessage(signature: Buffer, signerPublicKey: Buffer): Promise<void>

  /**
   * Retrieves the signature for the provided message and signer public key
   * if one has been stored.
   *
   * @param message The message of the desired signature
   * @param signerPublicKey The public key of the signer
   * @returns The signature, if one is known, for the provided message
   */
  getMessageSignature(
    message: Buffer,
    signerPublicKey
  ): Promise<Buffer | undefined>
}
