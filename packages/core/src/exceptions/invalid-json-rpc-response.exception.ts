import { RuntimeException } from './runtime.exception'

export class InvalidJsonRpcResponseException extends RuntimeException {
  constructor(response: any) {
    super(`Response is not a valid JSON-RPC response: ${response}`)
  }
}
