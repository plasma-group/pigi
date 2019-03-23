import { RuntimeException } from './runtime.exception'

export class InvalidCastException extends RuntimeException {
  constructor(attempted: string, desired: string) {
    super(
      `Could not cast variable of type ${attempted} to instance of type ${desired}.`
    )
  }
}
