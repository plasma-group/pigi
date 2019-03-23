import { RuntimeException } from './runtime.exception'

export class InvalidProofException extends RuntimeException {
  constructor(hash: string) {
    super(`Received an invalid transaction proof for transaction: ${hash}`)
  }
}
