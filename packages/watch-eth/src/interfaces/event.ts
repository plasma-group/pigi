export interface EthereumEventHandler {
  handleEvent(event: Event): Promise<void>
}

export interface Event {
  eventID: string
  name: string
  signature: string
  values: {}
}
