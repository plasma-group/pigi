import { AddressBalance, StateChannelMessage } from './examples'
import { BigNumber, Message, ParsedMessage } from '../../types'

const jsonReplacer = (key: any, value: any): any => {
  if (Buffer.isBuffer(value)) {
    return value.toString()
  }

  return value
}

/**
 * Serializes the provided object to its canonical string representation.
 *
 * @param obj The object to serialize.
 * @returns The serialized object as a string.
 */
export const serializeObject = (obj: {}): string => {
  return JSON.stringify(obj, jsonReplacer)
}

/**
 * Deserializes the provided string into its object representation.
 * This assumes the string was serialized using the associated serializer.
 *
 * @param obj The string to deserialize.
 * @returns The deserialized object.
 */
export const deserializeObject = (obj: string): {} => {
  return JSON.parse(obj)
}

/**
 * Gets the canonical buffer representation of the provided object.
 *
 * @param obj The object
 * @returns The resulting Buffer
 */
export const objectToBuffer = (obj: {}): Buffer => {
  return Buffer.from(serializeObject(obj))
}

/**
 * Turns the provided StateChannelMessage into its canonical buffer representation.
 *
 * @param message The StateChannelMessage
 * @returns The resulting Buffer
 */
export const stateChannelMessageToBuffer = (
  message: StateChannelMessage
): Buffer => {
  return objectToBuffer(message)
}

/**
 * Turns the provided Message into its canonical buffer representation.
 *
 * @param message The StateChannelMessage
 * @param messageSerializer: The serializer for turning the message's data object into a buffer
 * @returns The resulting Buffer
 */
export const messageToBuffer = (
  message: Message,
  messageSerializer: ({}) => Buffer
): Buffer => {
  return objectToBuffer({
    channelId: message.channelId,
    nonce: message.nonce,
    data: messageSerializer(message.data),
  })
}

/**
 * Deserializes the provided Buffer into the object it represents.
 *
 * @param buffer The buffer to be deserialized
 * @param messageDeserializer The deserializer for turning the buffer into the appropriate data object
 * @param functionParams The parameters (in addition to the string representation of the buffer) that the deserializer requires
 * @returns The resulting object
 */
export const deserializeBuffer = (
  buffer: Buffer,
  messageDeserializer: (string, any?) => any,
  functionParams?: any
): any => {
  return messageDeserializer(buffer.toString(), functionParams)
}

/**
 * Deserializes the provided string into the Message it represents.
 *
 * @param message The string of the Message to be deserialized
 * @param dataDeserializer The deserializer for turning the data portion of the Message into the appropriate sub-message type
 * @returns The resulting Message
 */
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

/**
 * Deserializes the provided object into a StateChannelMessage.
 *
 * @param obj The object to convert into a StateChannelMessage.
 * @returns The resulting StateChannelMessage.
 */
export const stateChannelMessageObjectDeserializer = (obj: {}): StateChannelMessage => {
  const addressBalance: AddressBalance = {}
  Object.entries(obj['addressBalance']).forEach(
    ([address, balance]: [string, string]) => {
      addressBalance[address] = new BigNumber(balance)
    }
  )

  return {
    addressBalance,
  }
}
