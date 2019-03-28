import '../../../setup'
import { dbRootPath } from '../../../setup'

/* External Imports */
const path = require('path')
const fs = require('fs')

/* Internal Imports */
import { StateService } from '../../../../src/services/state-manager/state.service'
import { FileSystemTransactionLog } from '../../../../src/services/state-manager/transaction-log'

describe('StateService', () => {
  const config = {
    txLogPath: path.join(dbRootPath, 'transaction-log-unit-tests')
  }
  const txLog = new FileSystemTransactionLog(config.txLogPath)
  it('should create a new directory at the given path', async () => {
    fs.existsSync(config.txLogPath).should.be.true
  })
})
