/* External Imports */
const fs = require('fs-extra')
const log = require('debug')('info:state-manager:tx-log')
const path = require('path')
import BigNum = require('bn.js')

/* Internal Imports */
import { BLOCKNUMBER_BYTE_SIZE } from '../../constants/serialization'


export interface TransactionLog {
  writeTransaction(transaction: Buffer): Promise<void>
  startNewBlock(blockNumber: BigNum): Promise<void>
}

export class FileSystemTransactionLog implements TransactionLog {
  private tmpTxLogPath:string
  private writeStream:NodeJS.WritableStream

  constructor(
    private readonly txLogDirPath: string,
  ) {
    this.tmpTxLogPath = path.join(txLogDirPath, 'tmp-tx-log.bin')
    // Make a new tx-log directory if it doesn't exist.
    if (!fs.existsSync(txLogDirPath)) {
      log('Creating a new tx-log directory')
      fs.mkdirSync(txLogDirPath)
    }
    // Open a write stream for our tx log
    if (fs.existsSync(this.tmpTxLogPath)) {
      console.log(
        'WARNING:',
        `Partially complete transaction log detected.
        Starting from where we left off but note that for extra security you may want to
        start from scratch & reingest only the finalized blocks in the transaction log.`
      )
    }
    this.writeStream = fs.createWriteStream(this.tmpTxLogPath, { flags: 'a' })
  }

  public async writeTransaction(transaction: Buffer) {
    this.writeStream.write(transaction)
  }

  public async startNewBlock(blockNumber: BigNum) {
    this.writeStream.end()
    const txLogPath = path.join(this.txLogDirPath, blockNumber.toString(10, BLOCKNUMBER_BYTE_SIZE * 2))
    await fs.rename(this.tmpTxLogPath, txLogPath)
    this.writeStream = fs.createWriteStream(this.tmpTxLogPath, { flags: 'a' })
  }
}
