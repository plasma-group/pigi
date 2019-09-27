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

export class EventProcessor {
  private readonly subscriptions: Map<string, Set<EthereumEventHandler>>
  private currentBlockNumber: number
  private earliestBlock: number

  constructor(private readonly db: DB, earliestBlock: number = 0) {
    this.subscriptions = new Map<string, Set<EthereumEventHandler>>()
    this.currentBlockNumber = 0
  }

  public async subscribe(
    contract: ethers.Contract,
    eventName: string,
    handler: EthereumEventHandler
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
      const event: Event = this.getEventFromEthersEvent(ethersEvent)
      this.handleEvent(event)
    })

    await this.backfillEvents(contract, eventName, eventId)
  }

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
      return EventProcessor.getEventFromLogDesc(logDesc, eventId)
    })

    for (const event of events) {
      this.handleEvent(event)
    }
    log.debug(`Backfilling events for event ${eventName}, ${eventId}`)
  }

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

  private getEventID(address: string, eventName: string): string {
    return Md5Hash(`${address}${eventName}`)
  }

  private async getBlockNumber(
    provider: ethers.providers.Provider
  ): Promise<number> {
    if (this.currentBlockNumber === 0) {
      this.currentBlockNumber = await provider.getBlockNumber()
    }

    return this.currentBlockNumber
  }

  private static getEventFromLogDesc(
    logDesc: ethers.utils.LogDescription,
    eventID: string
  ): Event {
    const values = EventProcessor.getLogValues(logDesc.values)
    return {
      eventID,
      name: logDesc.name,
      signature: logDesc.signature,
      values,
    }
  }

  private getEventFromEthersEvent(event: ethers.Event): Event {
    const values = EventProcessor.getLogValues(event.args)
    return {
      eventID: this.getEventID(event.address, event.event),
      name: event.event,
      signature: event.eventSignature,
      values,
    }
  }

  private static getLogValues(logArgs: {}): {} {
    const values = { ...logArgs }

    for (let i = 0; i < logArgs['length']; i++) {
      delete values[i.toString()]
    }
    delete values['length']

    return values
  }
}
