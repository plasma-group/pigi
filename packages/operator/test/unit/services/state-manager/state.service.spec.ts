import '../../../setup'

/* External Imports */
import BigNum = require('bn.js')
import { DBService, ConfigService, EphemDBProvider, LevelDB } from '@pigi/core'
const path = require('path')

/* Internal Imports */
import { StateService } from '../../../../src/services/state-manager/state.service'
import { FileSystemTransactionLog } from '../../../../src/services/state-manager/tx-log.service'

describe('StateService', () => {
  const config = {
    stateDBPath: 'state-db',
    txLogPath: 'tx-log',
  }
  const db = new LevelDB(path.join(__dirname, config.stateDBPath))
  const txLog = new FileSystemTransactionLog(path.join(__dirname, config.txLogPath))
  const stateService = new StateService(db, txLog)

  it('should open two DBs', async () => {
  })
})
