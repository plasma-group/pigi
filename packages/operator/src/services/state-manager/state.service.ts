/* External Imports */
import { AbiCoder } from 'web3-eth-abi'
import AsyncLock = require('async-lock')
import { BaseDBProvider, EphemDBProvider, LevelDB } from '@pigi/core'

/* Internal Imports */
import { TransactionLog } from './transaction-log'

export class StateService {
  private lock = new AsyncLock()
  private abiCoder = new AbiCoder()

  constructor(
    private readonly db: BaseDBProvider,
    private readonly transactionLog: TransactionLog,
  ) {}

  test() {
    return 'This is a test'
  }
}
