/* External Imports */
import debug from 'debug'
const log = debug('test:info:ownership-predicate')
import BigNum = require('bn.js')

/* Internal Imports */
import { OwnershipTransaction } from '../../../src/app/predicates/ownership/transaction'

describe('OwnershipTransaction', () => {
  it.only('should initalize', async() => {
    const newStateObject = {
      predicateAddress: '0x7Fa6da9966869B56Dd08cb111Efed88FDF799545',
      data: Buffer.from('hello world'),
      encoded: '0x1234'
    }
    const ownershipTx = new OwnershipTransaction(
      '0x7Fa6da9966869B56Dd08cb111Efed88FDF799545',
      1,
      { start: new BigNum(1), end: new BigNum(10) },
      '0x00',
      { newStateObject },
      {
        v: '0x0000000000000000000000000000000000000000000000000000000000000000',
        r: '0x0000000000000000000000000000000000000000000000000000000000000000',
        s: '0x00',
      }
    )
    log(ownershipTx)
    log(ownershipTx.encoded)
  })
})
