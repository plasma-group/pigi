import './setup'

/* External Imports */
import {
  ONE,
  OwnershipBody,
  Range,
  StateObject,
  StateUpdate,
  Transaction,
  stateObjectsEqual,
  BigNumber,
  DefaultWallet,
  DefaultWalletDB,
  BaseDB,
} from '@pigi/core'
import MemDown from 'memdown'
import * as assert from 'assert'

/* Internal Imports */
import { UnipigWallet, UNI } from '../src'

/***********
 * HELPERS *
 ***********/

/*********
 * TESTS *
 *********/

describe('UnipigWallet', async () => {
  let walletdb
  let unipigWallet
  let accountAddress

  beforeEach(async () => {
    // Typings for MemDown are wrong so we need to cast to `any`.
    walletdb = new DefaultWalletDB(new BaseDB(new MemDown('') as any))
    unipigWallet = new UnipigWallet(walletdb)
    // Now create a wallet account
    accountAddress = unipigWallet.createAccount('')
  })

  describe('sendSignedTransaction()', async () => {
    it('should initalize', async () => {
      // Create a tx
      const swap = unipigWallet.sendSwapTransaction({
        tokenType: 1,
        inputAmount: new BigNumber(500),
        minOutputAmount: new BigNumber(300),
        timeout: Date.now() + 1000,
      })
      console.log(swap)
    })
  })
})
