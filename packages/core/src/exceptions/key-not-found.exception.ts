import { RuntimeException } from './runtime.exception'

export class KeyNotFoundException extends RuntimeException {
  constructor(key: string, context: string) {
    super(`Key "${key}" was not found during lookup in ${context}.`)
  }
}
