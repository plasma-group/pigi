import { getLogger, sleep } from '@pigi/core'
import { EthereumEventHandler, Event } from '../src/event-processor'

const log = getLogger('watch-eth-test-utils', true)

export class EventListener implements EthereumEventHandler {
  private eventsReceived: Event[]

  public constructor() {
    this.eventsReceived = []
  }

  public async handleEvent(event: Event): Promise<void> {
    this.eventsReceived.push(event)
  }

  public getEventsReceived(): Event[] {
    const events = this.eventsReceived
    this.eventsReceived = []

    return events
  }

  public async waitForEvents(): Promise<Event[]> {
    while (!this.eventsReceived.length) {
      await sleep(50)
    }
    return this.getEventsReceived()
  }
}
