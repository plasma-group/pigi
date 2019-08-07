import { BigNumber, Property, WitnessFactory } from '../../../types'
import {
  AndDecider,
  ForAllSuchThatDecider,
  MessageEqualsDecider,
  MessageEqualsInput,
  MessageInvalidatedDecider,
  MessageInvalidatedInput,
  MessageInvalidatedWitness,
} from '../../ovm/deciders'
import {
  SignedByDecider,
  SignedByInput,
} from '../../ovm/deciders/signed-by-decider'
import { OrDecider } from '../../ovm/deciders/or-decider'
import { SignedByQuantifier } from '../../ovm/quantifiers/signed-by-quantifier'
import { ThereExistsSuchThatDecider } from '../../ovm/deciders/there-exists-such-that-decider'

export interface AddressBalance {
  [address: string]: BigNumber
}

export interface MessageInvalidatedClaim extends Property {
  decider: MessageInvalidatedDecider
  input: MessageInvalidatedInput
}

export type MessageInvalidatedWitnessFactory = (
  input: any
) => MessageInvalidatedWitness

export interface MessageInvalidatedOrCurrentClaim extends Property {
  decider: OrDecider
  input: {
    properties: [
      {
        decider: ThereExistsSuchThatDecider
        input: {
          quantifier: SignedByQuantifier
          quantifierParameters: any
          propertyFactory: MessageInvalidatedClaim
          witnessFactory: MessageInvalidatedWitnessFactory
        }
      },
      {
        decider: MessageEqualsDecider
        input: MessageEqualsInput
      }
    ]
  }
}

export type MessageInvalidatedOrCurrentPropertyFactory = (
  input: any
) => MessageInvalidatedOrCurrentClaim

export interface StateChannelClaim extends Property {
  decider: AndDecider
  input: {
    left: {
      decider: SignedByDecider // Asserts message this message invalidates is signed by counter-party
      input: SignedByInput
    }
    leftWitness: any
    right: {
      decider: ForAllSuchThatDecider
      input: {
        quantifier: SignedByQuantifier
        quantifierParameters: any
        propertyFactory: MessageInvalidatedOrCurrentPropertyFactory
        witnessFactory: WitnessFactory
      }
    }
  }
}

export interface StateChannelMessage {
  invalidatesNonce: BigNumber
  addressBalance: AddressBalance
  messageContractAddress: Buffer // TODO: insert whole claim here -- this is just a shortcut for the claim
}
