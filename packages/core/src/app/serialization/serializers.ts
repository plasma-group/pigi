import { AddressBalance, StateChannelMessage } from './examples'
import { BigNumber, Message, ParsedMessage } from '../../types'

const jsonReplacer = (key: any, value: any): any => {
  if (Buffer.isBuffer(value)) {
    return value.toString()
  }

  return value
}

export const serializeObject = (obj: {}): string => {
  return JSON.stringify(obj, jsonReplacer)
}

export const deserializeObject = (obj: string): {} => {
  return JSON.parse(obj)
}

export const objectToBuffer = (obj: {}): Buffer => {
  return Buffer.from(serializeObject(obj))
}

export const stateChannelMessageToBuffer = (
  message: StateChannelMessage
): Buffer => {
  return objectToBuffer(message)
}

export const parsedMessageToBuffer = (
  message: ParsedMessage,
  msgSerializer: ({}) => Buffer
): Buffer => {
  return objectToBuffer({
    sender: message.sender.toString(),
    recipient: message.recipient.toString(),
    message: msgSerializer(message.message),
    signatures: serializeObject(message.signatures),
  })
}

export const deserializeBuffer = (
  buff: Buffer,
  deserializationFunction: (string, any?) => any,
  functionParams?: any
): any => {
  return deserializationFunction(buff.toString(), functionParams)
}

export const deserializeMessage = (
  message: string,
  dataDeserializer: (string) => {}
): Message => {
  const parsedObject = deserializeObject(message)
  return {
    channelId: Buffer.from(parsedObject['channelId']),
    nonce:
      'nonce' in parsedObject
        ? new BigNumber(parsedObject['nonce'])
        : undefined,
    data: dataDeserializer(parsedObject['data']),
  }
}

export const stateChannelMessageObjectDeserializer = (obj: {}): StateChannelMessage => {
  const addressBalance: AddressBalance = {}
  Object.entries(obj['addressBalance']).forEach(
    ([address, balance]: [string, string]) => {
      addressBalance[address] = new BigNumber(balance)
    }
  )

  return {
    invalidatesNonce: obj['invalidatesNonce']
      ? new BigNumber(obj['invalidatesNonce'])
      : undefined,
    addressBalance,
    messageContractAddress: Buffer.from(obj['messageContractAddress']),
  }
}
