/* External Imports */
import { getLogger, SignedByDBInterface } from '@pigi/core'

/* Internal Imports */
import { Address, SignedStateReceipt } from './index'

const log = getLogger('rollup-ovm')

/**
 * The OVM processor for UniPig-like applications
 */
export class RollupOvm {
  constructor(
    private signedByDB: SignedByDBInterface,
    private myAddress: Address
  ) {}

  public async storeStateReceipt(receipt: SignedStateReceipt): Promise<void> {
    return
  }
}
