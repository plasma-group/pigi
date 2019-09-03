/* Imports */
import { BaseDB, SimpleClient } from '@pigi/core'
import MemDown from 'memdown'
import {
  State,
  UNISWAP_ADDRESS,
  AGGREGATOR_ADDRESS,
  UnipigWallet,
} from '@pigi/wallet'

/* Global declarations */
declare function updateAccountAddress(address: string): void
declare function updateBalances(balances: object): void

/* Body */
const db = new BaseDB(new MemDown('ovm') as any)
const unipigWallet = new UnipigWallet(db)
// Now create a wallet account
const accountAddress = 'mocked account'

// Connect to the mock aggregator
unipigWallet.rollup.connect(new SimpleClient('http://localhost:3000'))

// tslint:disable-next-line
updateAccountAddress(accountAddress)

async function fetchBalanceUpdate() {
  const response = await unipigWallet.getBalances(UNISWAP_ADDRESS)
  updateBalances(response)
}
fetchBalanceUpdate()
