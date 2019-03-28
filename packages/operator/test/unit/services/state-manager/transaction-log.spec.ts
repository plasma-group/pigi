import '../../../setup'

/* External Imports */
const path = require('path')
const fs = require('fs')

/* Internal Imports */
import { StateService } from '../../../../src/services/state-manager/state.service'
import { FileSystemTransactionLog } from '../../../../src/services/state-manager/transaction-log'

describe('StateService', () => {
  const config = {
    txLogPath: 'tx-log.test.tmp',
  }
  const txLogPath = path.join(__dirname, config.txLogPath)
  const txLog = new FileSystemTransactionLog(txLogPath)
  it('should create a new directory at the given path', async () => {
    fs.existsSync(txLogPath).should.be.true
  })
})
