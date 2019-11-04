/* External Imports */
import { BigNumber, BIG_ENDIAN } from '@pigi/core-utils'

/* Internal Imports */
import { Transaction } from '../../types'

export const bnToUint256 = (bn: BigNumber): Buffer => {
  return bn.toBuffer(BIG_ENDIAN, 32)
}

/**
 * Gets the end of a transaction range as a Uint256 Buffer.
 * @param transaction Transaction to query.
 * @returns the transacted range's end as a Uint256 Buffer.
 */
export const getTransactionRangeEnd = (transaction: Transaction): Buffer => {
  const end = transaction.range.end
  return bnToUint256(end)
}
