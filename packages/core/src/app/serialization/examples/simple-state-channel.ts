import { BigNumber, Property } from '../../../types'
import {
  AndDecider,
  ForAllSuchThatDecider,
  NonceLessThanDecider,
} from '../../ovm/deciders'
import {
  SignedByDecider,
  SignedByInput,
} from '../../ovm/deciders/signed-by-decider'
import { SignedByQuantifier } from '../../ovm/quantifiers/signed-by-quantifier'

/*
INTERFACES FOR StateChannelExitClaim
 */
export interface NonceLessThanProperty {
  decider: NonceLessThanDecider
  input: any
}

export type NonceLessThanPropertyFactory = (input: any) => NonceLessThanProperty

export interface StateChannelExitClaim extends Property {
  decider: AndDecider
  input: {
    left: {
      decider: SignedByDecider // Asserts this message is signed by counter-party
      input: SignedByInput
    }
    leftWitness: any
    right: {
      decider: ForAllSuchThatDecider
      input: {
        quantifier: SignedByQuantifier
        quantifierParameters: any
        propertyFactory: NonceLessThanPropertyFactory
      }
    }
    rightWitness: any
  }
}

/*
INTERFACES FOR StateChannelMessage
 */
export interface AddressBalance {
  [address: string]: BigNumber
}

export interface StateChannelMessage {
  addressBalance: AddressBalance
}
