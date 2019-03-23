import { RuntimeException } from './runtime.exception'

export class UninitializedValueException extends RuntimeException {
  constructor(name: string) {
    super(`Value "${name}" has not yet been initialized.`)
  }
}
