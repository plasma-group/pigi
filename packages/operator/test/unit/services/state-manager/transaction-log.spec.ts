import '../../../setup'
import { dbRootPath } from '../../../setup'

/* External Imports */
const path = require('path')
const fs = require('fs')
import BigNum = require('bn.js')

/* Internal Imports */
import { StateService } from '../../../../src/services/state-manager/state.service'
import { FileSystemTransactionLog } from '../../../../src/services/state-manager/transaction-log'
import { BLOCKNUMBER_BYTE_SIZE } from '../../../../src/constants/serialization'

describe('StateService', () => {
  const config = {
    txLogPath: path.join(dbRootPath, 'transaction-log-unit-tests')
  }
  const txLog = new FileSystemTransactionLog(config.txLogPath)
  it('should create a new directory at the given path', async () => {
    fs.existsSync(config.txLogPath).should.be.true
  })

  it('should append the correct messages to the block file', async () => {
    // First write a 'transaction'
    await txLog.writeTransaction(Buffer.from('Testing testing 123'))
    // Next start a new 'block'
    const blockNumber = new BigNum(1)
    await txLog.startNewBlock(blockNumber)
    // Check the block was created
    const blockFilename = path.join(config.txLogPath, blockNumber.toString(10, BLOCKNUMBER_BYTE_SIZE * 2))
    fs.existsSync(blockFilename).should.be.true
    // Check the contents is correct
    fs.readFileSync(blockFilename, 'utf8').should.equal('Testing testing 123')
  })
})
