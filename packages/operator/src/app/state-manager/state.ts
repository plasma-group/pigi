/* External Imports */
import BigNum = require('bn.js')

/* Internal Imports */
import { RangeStore, RangeEntry } from '../../interfaces/db/range-db.interface'
import { Transaction, StateObject, StateUpdate } from '../../interfaces/data-types'

interface Predicate {
  transitionStateUpdate: Promise<StateUpdate>
}

export class StateDB {
  constructor (
    readonly rangeDB: RangeStore,
  ) {}

  public async getVerifiedState(start: BigNum, end: BigNum): Promise<RangeEntry[]> {
    const res = await this.rangeDB.get(start, end)
    return res
  }
}

export class StateManager {
  constructor (
    readonly stateDB: StateDB,
    readonly predicates: Predicate[]
  ) {}

//   public async executeTransaction(
//     transaction: Transaction
//   ): Promise<{ stateUpdate: StateUpdate, validRanges: RangeEntry[] }> {
//     const verifiedState = await this.stateDB.getVerifiedState(transaction.start, transaction.end)
//     const newState: StateUpdate
//     const validRanges: Range[] = []
//   }
}

