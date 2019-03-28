/* External Imports */
const fs = require('fs')
const log = require('debug')('info:state-manager:tx-log')

/* Internal Imports */

export interface TransactionLog {
  writeTransaction(transaction: Buffer): Promise<boolean>
  startNewBlock(): Promise<number>
}

export class FileSystemTransactionLog implements TransactionLog {
  private tmpTxLogPath:string
  private writeStream:NodeJS.ReadableStream

  constructor(
    private readonly txLogDirPath: string,
  ) {
    this.tmpTxLogPath = txLogDirPath + 'tmp-tx-log.bin'

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
    return true
  }

  public async startNewBlock() {
    return 10
  }
}
