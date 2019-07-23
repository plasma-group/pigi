/* External Imports */
import debug from 'debug'
const log = debug('info:state-update')

/* Internal Imports */
import { abi, BigNumber, hexStringify } from '../../app'
import { StateUpdate, AbiEncodable } from '../../types'
import { AbiStateObject } from './state-object'
import { AbiRange } from './abi-range'

/**
 * Creates a AbiStateUpdate from an encoded AbiStateUpdate.
 * @param encoded The encoded AbiStateUpdate.
 * @returns the AbiStateUpdate.
 */
const fromEncoded = (encoded: string): AbiStateUpdate => {
  const decoded = abi.decode(AbiStateUpdate.abiTypes, encoded)
  const stateObject = AbiStateObject.from(decoded[0])
  const range = AbiRange.from(decoded[1])
  return new AbiStateUpdate(
    stateObject,
    range,
    new BigNumber(decoded[2].toString()),
    decoded[3]
  )
}

/**
 * Serializes a StateUpdate to a string.
 *
 * @param stateUpdate the StateUpdate to serialize
 * @returns the serialized StateUpdate
 */
export const serializeStateUpdate = (stateUpdate: StateUpdate): string => {
  return JSON.stringify(stateUpdate)
}

/**
 * Deserializes a StateUpdate, parsing it from a string.
 *
 * @param stateUpdate the string StateUpdate
 * @returns the parsed StateUpdate
 */
export const deserializeStateUpdate = (stateUpdate: string): StateUpdate => {
  const obj: {} = JSON.parse(stateUpdate)
  return {
    range: {
      start: new BigNumber(obj['range']['start'], 'hex'),
      end: new BigNumber(obj['range']['end'], 'hex'),
    },
    stateObject: obj['stateObject'],
    depositAddress: obj['depositAddress'],
    plasmaBlockNumber: new BigNumber(obj['plasmaBlockNumber']),
  }
}

/**
 * Represents a basic abi encodable AbiStateUpdate
 */
export class AbiStateUpdate implements StateUpdate, AbiEncodable {
  public static abiTypes = ['bytes', 'bytes', 'uint256', 'address']

  constructor(
    readonly stateObject: AbiStateObject,
    readonly range: AbiRange,
    readonly plasmaBlockNumber: BigNumber,
    readonly depositAddress: string
  ) {}

  /**
   * @returns the abi encoded AbiStateUpdate.
   */
  get encoded(): string {
    return abi.encode(AbiStateUpdate.abiTypes, [
      this.stateObject.encoded,
      this.range.encoded,
      hexStringify(this.plasmaBlockNumber),
      this.depositAddress,
    ])
  }

  /**
   * @returns the jsonified AbiStateUpdate.
   */
  get jsonified(): any {
    return {
      stateObject: this.stateObject.jsonified,
      range: this.range.jsonified,
      plasmaBlockNumber: this.plasmaBlockNumber,
      depositAddress: this.depositAddress,
    }
  }

  /**
   * Casts a value to a AbiStateUpdate.
   * @param value Thing to cast to a AbiStateUpdate.
   * @returns the AbiStateUpdate.
   */
  public static from(value: string): AbiStateUpdate {
    if (typeof value === 'string') {
      return fromEncoded(value)
    }

    throw new Error('Got invalid argument type when casting to AbiStateUpdate.')
  }

  /**
   * Determines if this object equals another.
   * @param other Object to compare to.
   * @returns `true` if the two are equal, `false` otherwise.
   */
  public equals(other: AbiStateUpdate): boolean {
    return this.encoded === other.encoded
  }
}
