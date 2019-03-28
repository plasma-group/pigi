import '../../../setup'
import { dbRootPath } from '../../../setup'

/* External Imports */
import BigNum = require('bn.js')
import { DBService, ConfigService, EphemDBProvider, LevelDB } from '@pigi/core'
const path = require('path')

/* Internal Imports */
import { StateService } from '../../../../src/services/state-manager/state.service'
import { FileSystemTransactionLog } from '../../../../src/services/state-manager/transaction-log'

describe('StateService', () => {
  const config = {
    stateDBPath: path.join(dbRootPath, 'state-service-unit--state-db'),
    txLogPath: path.join(dbRootPath, 'state-service-unit--transaction-log'),
  }
  const db = new LevelDB(config.stateDBPath)
  const txLog = new FileSystemTransactionLog(config.txLogPath)
  const stateService = new StateService(db, txLog)

  it('should open two DBs', async () => {
  })
})
