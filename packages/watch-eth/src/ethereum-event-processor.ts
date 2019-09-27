import { DB, getLogger, Md5Hash } from '@pigi/core'
import { ethers } from 'ethers'

const log = getLogger('event-processor')

export interface EthereumEventHandler {
  handleEvent(event: Event): Promise<void>
}

export interface Event {
  eventID: string
  name: string
  signature: string
  values: {}
}

/**
 * Ethereum Event Processor
 * The single class to process and disseminate all Ethereum Event subscriptions.
 */
export class EthereumEventProcessor {
  private readonly subscriptions: Map<string, Set<EthereumEventHandler>>
  private currentBlockNumber: number

  constructor(
    private readonly db: DB,
    private readonly earliestBlock: number = 0
  ) {
    this.subscriptions = new Map<string, Set<EthereumEventHandler>>()
    this.currentBlockNumber = 0
  }

  /**
   * Subscribes to the event with the provided name for the  provided contract.
   * This will also fetch and send the provided event handler all historical events not in
   * the database unless backfill is set to false.
   *
   * @param contract The contract of the event
   * @param eventName The event name
   * @param handler The event handler subscribing
   * @param backfill Whether or not to fetch previous events
   */
  public async subscribe(
    contract: ethers.Contract,
    eventName: string,
    handler: EthereumEventHandler,
    backfill: boolean = true
  ): Promise<void> {
    const eventId: string = this.getEventID(contract.address, eventName)
    log.debug(`Received subscriber for event ${eventName}, ID: ${eventId}`)

    if (!this.subscriptions.has(eventId)) {
      this.subscriptions.set(eventId, new Set<EthereumEventHandler>([handler]))
    } else {
      this.subscriptions.get(eventId).add(handler)
    }

    contract.on(contract.filters[eventName](), (...data) => {
      log.debug(`Received live event: ${JSON.stringify(data)}`)
      const ethersEvent: ethers.Event = data[data.length - 1]
      const event: Event = this.createEventFromEthersEvent(ethersEvent)
      this.handleEvent(event)
    })

    if (backfill) {
      await this.backfillEvents(contract, eventName, eventId)
    }
  }

  /**
   * Fetches historical events for the provided contract with the provided event name.
   *
   * @param contract The contract for the events.
   * @param eventName The event name.
   * @param eventId The local event ID to identify the event in this class.
   */
  private async backfillEvents(
    contract: ethers.Contract,
    eventName: string,
    eventId: string
  ): Promise<void> {
    log.debug(`Backfilling events for event ${eventName}`)
    const blockNumber = await this.getBlockNumber(contract.provider)

    const lastSyncedBlockBuffer: Buffer = await this.db.get(
      Buffer.from(eventId)
    )
    const lastSyncedNumber: number = !!lastSyncedBlockBuffer
      ? parseInt(lastSyncedBlockBuffer.toString(), 10)
      : this.earliestBlock

    if (blockNumber === lastSyncedNumber) {
      return
    }

    const filter: ethers.providers.Filter = contract.filters[eventName]()
    filter.fromBlock = lastSyncedNumber + 1
    filter.toBlock = 'latest'

    const logs: ethers.providers.Log[] = await contract.provider.getLogs(filter)
    const events: Event[] = logs.map((l) => {
      const logDesc: ethers.utils.LogDescription = contract.interface.parseLog(
        l
      )
      return EthereumEventProcessor.createEventFromLogDesc(logDesc, eventId)
    })

    for (const event of events) {
      this.handleEvent(event)
    }
    log.debug(
      `Backfilling events for event ${eventName}, ${eventId}. Found ${events.length} events`
    )
  }

  /**
   * Handles an event, whether live or historical, and passes it to all subscribers.
   *
   * @param event The event to disseminate.
   */
  private async handleEvent(event: Event): Promise<void> {
    log.debug(`Handling event ${JSON.stringify(event)}`)
    const subscribers: Set<EthereumEventHandler> = this.subscriptions.get(
      event.eventID
    )

    subscribers.forEach((sub) => {
      try {
        sub.handleEvent(event)
      } catch (e) {
        // should be logged in subscriber
      }
    })
  }

  /**
   * Fetches the current block number from the given provider.
   *
   * @param provider The provider connected to a node
   * @returns The current block number
   */
  private async getBlockNumber(
    provider: ethers.providers.Provider
  ): Promise<number> {
    if (this.currentBlockNumber === 0) {
      this.currentBlockNumber = await provider.getBlockNumber()
    }

    return this.currentBlockNumber
  }

  /**
   * Creates a local Event from the provided Ethers LogDesc.
   *
   * @param logDesc The LogDesc in question
   * @param eventID The local event ID
   * @returns The local Event
   */
  private static createEventFromLogDesc(
    logDesc: ethers.utils.LogDescription,
    eventID: string
  ): Event {
    const values = EthereumEventProcessor.getLogValues(logDesc.values)
    return {
      eventID,
      name: logDesc.name,
      signature: logDesc.signature,
      values,
    }
  }

  /**
   * Creates a local Event from the provided Ethers event.
   *
   * @param event The event in question
   * @returns The local Event
   */
  private createEventFromEthersEvent(event: ethers.Event): Event {
    const values = EthereumEventProcessor.getLogValues(event.args)
    return {
      eventID: this.getEventID(event.address, event.event),
      name: event.event,
      signature: event.eventSignature,
      values,
    }
  }

  /**
   * Creates a JS object of key-value pairs for event fields and values.
   *
   * @param logArgs The args from the log event, including extra fields
   * @returns The values.
   */
  private static getLogValues(logArgs: {}): {} {
    const values = { ...logArgs }

    for (let i = 0; i < logArgs['length']; i++) {
      delete values[i.toString()]
    }
    delete values['length']

    return values
  }

  /**
   * Gets a unique ID for the event with the provided address and name.
   *
   * @param address The address of the event
   * @param eventName The name of the event
   * @returns The unique ID string.
   */
  private getEventID(address: string, eventName: string): string {
    return Md5Hash(`${address}${eventName}`)
  }
}
