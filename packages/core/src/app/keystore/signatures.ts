import { SignatureProvider, SignatureVerifier } from '../../types/keystore'
import { ethers } from 'ethers'

export class DefaultSignatureVerifier implements SignatureVerifier {
  private static _instance: SignatureVerifier

  public static instance(): SignatureVerifier {
    if (!DefaultSignatureVerifier._instance) {
      DefaultSignatureVerifier._instance = new DefaultSignatureVerifier()
    }
    return DefaultSignatureVerifier._instance
  }

  public verifyMessage(message: string, signature: string): string {
    return ethers.utils.verifyMessage(message, signature)
  }
}
