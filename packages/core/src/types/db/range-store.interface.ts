/* External Imports */
import { BigNumber } from '@pigi/core-utils'

export interface Range {
  start: BigNumber
  end: BigNumber
}

export interface BlockRange extends Range {
  block: BigNumber
}
