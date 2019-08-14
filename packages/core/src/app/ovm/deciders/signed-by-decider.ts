import { Decider, Decision } from '../../../types/ovm'
import { CannotDecideError } from './utils'
import { SignedByDb } from '../db/signed-by-db'

export interface SignedByInput {
  publicKey: Buffer
  message: Buffer
}

export type SignatureVerifier = (
  publicKey: Buffer,
  message: Buffer,
  signature: Buffer
) => Promise<boolean>

/**
 * Decider that determines whether the provided witness is the provided message signed by
 * the private key associated with the provided public key.
 */
export class SignedByDecider implements Decider {
  constructor(
    private readonly signedByDb: SignedByDb,
    private readonly myAddress: Buffer
  ) {}

  public async decide(
    input: any,
    _witness?: undefined,
    _noCache?: boolean
  ): Promise<Decision> {
    const signature: Buffer = await this.signedByDb.getMessageSignature(
      input.message,
      input.publicKey
    )

    if (!signature && !input.publicKey.equals(this.myAddress)) {
      throw new CannotDecideError(
        'Signature does not match the provided witness, but we do not know for certain that the message was not signed by the private key associated with the provided public key.'
      )
    }

    return this.constructDecision(signature, input.publicKey, input.message)
  }

  /**
   * Builds a Decision from the provided signature, public key, message, and outcome.
   *
   * @param signature The signature
   * @param publicKey The public key used with the signature
   * @param message The decrypted message
   * @returns the Decision
   */
  private constructDecision(
    signature: Buffer | undefined,
    publicKey: Buffer,
    message: Buffer
  ): Decision {
    return {
      outcome: !!signature,
      justification: [
        {
          implication: {
            decider: this,
            input: {
              publicKey,
              message,
            },
          },
          implicationWitness: {
            signature,
          },
        },
      ],
    }
  }
}
