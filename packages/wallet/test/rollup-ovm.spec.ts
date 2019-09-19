import './setup'

/* External Imports */
import {
  SignedByDB,
  newInMemoryDB,
  Decider,
  FalseDecider,
  TrueDecider,
  ImplicationProofItem,
} from '@pigi/core'

/* Internal Imports */
import { InclusionProof, RollupOVM, SignedStateReceipt } from '../src/types'

import { BOB_ADDRESS } from './helpers'
import { DefaultRollupOVM } from '../src/rollup-ovm'
import {
  AGGREGATOR_ADDRESS,
  IdentityVerifier,
  PIGI_TOKEN_TYPE,
  UNI_TOKEN_TYPE,
} from '../src'
import * as assert from 'assert'

/* Internal Imports */

const stateRoot: string =
  '9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658'
const inclusionProof: InclusionProof = [stateRoot, stateRoot, stateRoot]
const trueDecider: Decider = new TrueDecider()
const falseDecider: Decider = new FalseDecider()
const signedStateReceipt: SignedStateReceipt = {
  signature: AGGREGATOR_ADDRESS,
  stateReceipt: {
    slotIndex: 4,
    stateRoot,
    inclusionProof,
    blockNumber: 1,
    transitionIndex: 2,
    state: {
      pubKey: BOB_ADDRESS,
      balances: {
        [UNI_TOKEN_TYPE]: 10,
        [PIGI_TOKEN_TYPE]: 30,
      },
    },
  },
}

describe('RollupOVM', () => {
  let rollupOVM: RollupOVM
  let signedByDB: SignedByDB
  describe('Merkle Proof true decider', () => {
    describe('isStateReceiptProvablyValid', () => {
      it('should determine valid receipt is valid', async () => {
        signedByDB = new SignedByDB(newInMemoryDB())

        rollupOVM = new DefaultRollupOVM(
          signedByDB,
          trueDecider,
          trueDecider,
          IdentityVerifier.instance()
        )
        await rollupOVM.storeSignedStateReceipt(signedStateReceipt)

        assert(
          await rollupOVM.isStateReceiptProvablyValid(
            signedStateReceipt.stateReceipt,
            AGGREGATOR_ADDRESS
          ),
          'State Receipt should be provably valid'
        )
      })
      it('should determine invalid receipt is invalid -- signature mismatch', async () => {
        signedByDB = new SignedByDB(newInMemoryDB())

        rollupOVM = new DefaultRollupOVM(
          signedByDB,
          falseDecider,
          trueDecider,
          IdentityVerifier.instance()
        )
        await rollupOVM.storeSignedStateReceipt(signedStateReceipt)

        assert(
          !(await rollupOVM.isStateReceiptProvablyValid(
            signedStateReceipt.stateReceipt,
            AGGREGATOR_ADDRESS
          )),
          'State Receipt should be provably invalid because signature should not match'
        )
      })
      it('should determine invalid receipt is invalid -- proof invalid', async () => {
        signedByDB = new SignedByDB(newInMemoryDB())

        rollupOVM = new DefaultRollupOVM(
          signedByDB,
          trueDecider,
          falseDecider,
          IdentityVerifier.instance()
        )
        await rollupOVM.storeSignedStateReceipt(signedStateReceipt)

        assert(
          !(await rollupOVM.isStateReceiptProvablyValid(
            signedStateReceipt.stateReceipt,
            AGGREGATOR_ADDRESS
          )),
          'State Receipt should be provably invalid because inclusion proof is invalid'
        )
      })
    })

    describe('getFraudProof', () => {
      it('should get valid fraud proof', async () => {
        signedByDB = new SignedByDB(newInMemoryDB())

        rollupOVM = new DefaultRollupOVM(
          signedByDB,
          trueDecider,
          trueDecider,
          IdentityVerifier.instance()
        )
        await rollupOVM.storeSignedStateReceipt(signedStateReceipt)

        const proof: ImplicationProofItem[] = await rollupOVM.getFraudProof(
          signedStateReceipt.stateReceipt,
          AGGREGATOR_ADDRESS
        )
        assert(
          proof && proof.length === 3,
          'Fraud proof should contain 3 elements for And, SignedBy, and MerkleInclusionProof Deciders'
        )
      })

      it('should determine invalid receipt is invalid -- signature mismatch', async () => {
        signedByDB = new SignedByDB(newInMemoryDB())

        rollupOVM = new DefaultRollupOVM(
          signedByDB,
          falseDecider,
          trueDecider,
          IdentityVerifier.instance()
        )
        await rollupOVM.storeSignedStateReceipt(signedStateReceipt)

        assert(
          !(await rollupOVM.getFraudProof(
            signedStateReceipt.stateReceipt,
            AGGREGATOR_ADDRESS
          )),
          'Fraud proof should be undefined because signature should not match'
        )
      })

      it('should determine invalid receipt is invalid -- proof invalid', async () => {
        signedByDB = new SignedByDB(newInMemoryDB())

        rollupOVM = new DefaultRollupOVM(
          signedByDB,
          trueDecider,
          falseDecider,
          IdentityVerifier.instance()
        )
        await rollupOVM.storeSignedStateReceipt(signedStateReceipt)

        assert(
          !(await rollupOVM.getFraudProof(
            signedStateReceipt.stateReceipt,
            AGGREGATOR_ADDRESS
          )),
          'Fraud proof should be undefined because inclusion proof is invalid'
        )
      })
    })
  })

  // TODO: For when signed by decider works with signature verification

  // describe('Merkle Proof true decider', () => {
  //   beforeEach(async () => {
  //     signedByDB = new SignedByDB(newInMemoryDB())
  //
  //     rollupOVM = new RollupOVM(
  //       signedByDB,
  //       new SignedByDecider(signedByDB, Buffer.from(BOB_ADDRESS)),
  //       trueDecider,
  //       IdentityVerifier.instance()
  //     )
  //     await rollupOVM.storeSignedStateReceipt(signedStateReceipt)
  //   })
  //
  //   describe('isStateReceiptProvablyValid', () => {
  //     it('should determine valid receipt is valid', async () => {
  //       assert(
  //         await rollupOVM.isStateReceiptProvablyValid(
  //           signedStateReceipt.stateReceipt,
  //           AGGREGATOR_ADDRESS
  //         ),
  //         'State Receipt should be provably valid'
  //       )
  //     })
  //     it('should determine invalid receipt is invalid', async () => {
  //       assert(
  //         !(await rollupOVM.isStateReceiptProvablyValid(
  //           signedStateReceipt.stateReceipt,
  //           ALICE_ADDRESS
  //         )),
  //         'State Receipt should be provably invalid because signature should not match'
  //       )
  //     })
  //   })
  //
  //   describe('getFraudProof', () => {
  //     it('should get valid fraud proof', async () => {
  //       const proof: ImplicationProofItem[] = await rollupOVM.getFraudProof(
  //         signedStateReceipt.stateReceipt,
  //         AGGREGATOR_ADDRESS
  //       )
  //       assert(
  //         proof && proof.length == 3,
  //         'Fraud proof should contain 3 elements for And, SignedBy, and MerkleInclusionProof Deciders'
  //       )
  //     })
  //
  //     it('should determine invalid receipt is invalid', async () => {
  //       assert(
  //         !(await rollupOVM.getFraudProof(
  //           signedStateReceipt.stateReceipt,
  //           ALICE_ADDRESS
  //         )),
  //         'Fraud proof should be undefined because signature should not match'
  //       )
  //     })
  //   })
  // })
  //
  // describe('Merkle Proof false decider', () => {
  //   beforeEach(async () => {
  //     signedByDB = new SignedByDB(newInMemoryDB())
  //
  //     rollupOVM = new RollupOVM(
  //       signedByDB,
  //       new SignedByDecider(signedByDB, Buffer.from(BOB_ADDRESS)),
  //       falseDecider,
  //       IdentityVerifier.instance()
  //     )
  //     await rollupOVM.storeSignedStateReceipt(signedStateReceipt)
  //   })
  //
  //   describe('isStateReceiptProvablyValid', () => {
  //     it('should determine invalid receipt is invalid', async () => {
  //       assert(
  //         !(await rollupOVM.isStateReceiptProvablyValid(
  //           signedStateReceipt.stateReceipt,
  //           AGGREGATOR_ADDRESS
  //         )),
  //         'State Receipt should be provably invalid because merkle proof should not be valid'
  //       )
  //     })
  //   })
  //
  //   describe('getFraudProof', () => {
  //     it('should determine invalid receipt is invalid', async () => {
  //       assert(
  //         !(await rollupOVM.getFraudProof(
  //           signedStateReceipt.stateReceipt,
  //           AGGREGATOR_ADDRESS
  //         )),
  //         'Fraud proof should be undefined because merkle proof should not be valid'
  //       )
  //     })
  //   })
  // })
})
