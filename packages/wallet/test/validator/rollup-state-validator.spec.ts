import '../setup'
import * as assert from 'assert'

/* External Imports */
import {DB, bufToHexString, newInMemoryDB, ChecksumAgnosticIdentityVerifier} from '@pigi/core'

/* Internal Imports */
import {
  ALICE_ADDRESS,
  ALICE_GENESIS_STATE_INDEX,
  BOB_ADDRESS,
  UNISWAP_GENESIS_STATE_INDEX,
} from '../helpers'

import {
  UNI_TOKEN_TYPE,
  UNISWAP_ADDRESS,
  AGGREGATOR_ADDRESS,
  DefaultRollupStateValidator,
  PIGI_TOKEN_TYPE,
  RollupStateValidator,
  LocalFraudProof,
  CreateAndTransferTransition,
  StateSnapshot,
  TransferTransition,
  State,
  SwapTransition,
  RollupBlock,
  ValidationOutOfOrderError,
  AggregatorUnsupportedError,
  ContractFraudProof, RollupStateMachine, DefaultRollupStateMachine,
} from '../../src'

/***********
 * HELPERS *
 ***********/

const BOB_GENESIS_STATE_INDEX = 3

function getMultiBalanceGenesis(
  aliceAddress: string = ALICE_ADDRESS,
  bobAddress: string = BOB_ADDRESS
): State[] {
  return [
    {
      pubkey: UNISWAP_ADDRESS,
      balances: {
        [UNI_TOKEN_TYPE]: 650_000,
        [PIGI_TOKEN_TYPE]: 650_000,
      },
    },
    {
      pubkey: aliceAddress,
      balances: {
        [UNI_TOKEN_TYPE]: 5_000,
        [PIGI_TOKEN_TYPE]: 5_000,
      },
    },
    {
      pubkey: AGGREGATOR_ADDRESS,
      balances: {
        [UNI_TOKEN_TYPE]: 1_000_000,
        [PIGI_TOKEN_TYPE]: 1_000_000,
      },
    },
    {
      pubkey: bobAddress,
      balances: {
        [UNI_TOKEN_TYPE]: 5_000,
        [PIGI_TOKEN_TYPE]: 5_000,
      },
    },
  ]
}

/*********
 * TESTS *
 *********/

describe('RollupStateValidator', () => {
  let rollupGuard: DefaultRollupStateValidator
  let stateDb: DB

  beforeEach(async () => {
    stateDb = newInMemoryDB()
    const rollupStateMachine: DefaultRollupStateMachine = await DefaultRollupStateMachine.create(
      getMultiBalanceGenesis(),
      stateDb,
      ChecksumAgnosticIdentityVerifier.instance()
    ) as DefaultRollupStateMachine

    rollupGuard = new DefaultRollupStateValidator(rollupStateMachine)
  })

  afterEach(async () => {
    await stateDb.close()
  })

  describe('initialization', () => {
    it('should create Guarder with a rollup machine', async () => {
      rollupGuard.rollupMachine.should.not.be.undefined
    })
  })

  describe('getInputStateSnapshots', () => {
    it('should get right inclusion proof for a swap', async () => {
      // pull initial root to compare later
      const genesisStateRootBuf: Buffer = await rollupGuard.rollupMachine.getStateRoot()
      const genesisStateRoot: string = bufToHexString(genesisStateRootBuf)
      // construct a swap transition
      const swapTransition: SwapTransition = {
        stateRoot: 'DOESNT_MATTER',
        senderSlotIndex: ALICE_GENESIS_STATE_INDEX,
        uniswapSlotIndex: UNISWAP_GENESIS_STATE_INDEX,
        tokenType: UNI_TOKEN_TYPE,
        inputAmount: 100,
        minOutputAmount: 20,
        timeout: 10,
        signature: ALICE_ADDRESS,
      }
      const snaps: StateSnapshot[] = await rollupGuard.getInputStateSnapshots(
        swapTransition
      )
      // make sure the right root was pulled
      snaps[0].stateRoot.should.equal(genesisStateRoot.replace('0x', ''))
      snaps[1].stateRoot.should.equal(genesisStateRoot.replace('0x', ''))
      // make sure the right pubkeys were pulled
      snaps[0].state.pubkey.should.equal(ALICE_ADDRESS)
      snaps[1].state.pubkey.should.equal(UNISWAP_ADDRESS)
    })
    it('should get right inclusion proof for a non creation transfer', async () => {
      // pull initial root to compare later
      const genesisStateRootBuf: Buffer = await rollupGuard.rollupMachine.getStateRoot()
      const genesisStateRoot: string = bufToHexString(genesisStateRootBuf)
      // construct a transfer transition
      const transferTransition: TransferTransition = {
        stateRoot: 'DOESNT_MATTER',
        senderSlotIndex: ALICE_GENESIS_STATE_INDEX,
        recipientSlotIndex: BOB_GENESIS_STATE_INDEX,
        tokenType: UNI_TOKEN_TYPE,
        amount: 10,
        signature: ALICE_ADDRESS,
      }
      const snaps: StateSnapshot[] = await rollupGuard.getInputStateSnapshots(
        transferTransition
      )
      // make sure the right root was pulled
      snaps[0].stateRoot.should.equal(genesisStateRoot.replace('0x', ''))
      snaps[1].stateRoot.should.equal(genesisStateRoot.replace('0x', ''))
      // make sure the right pubkeys were pulled
      snaps[0].state.pubkey.should.equal(ALICE_ADDRESS)
      snaps[1].state.pubkey.should.equal(BOB_ADDRESS)
    })
    it('should get right inclusion proof for a createAndTransfer', async () => {
      // pull initial root to compare later
      const genesisStateRootBuf: Buffer = await rollupGuard.rollupMachine.getStateRoot()
      const genesisStateRoot: string = bufToHexString(genesisStateRootBuf)
      // construct a transfer transition
      const creationTransition: CreateAndTransferTransition = {
        stateRoot: 'DOESNT_MATTER',
        senderSlotIndex: ALICE_GENESIS_STATE_INDEX,
        recipientSlotIndex: 40,
        tokenType: UNI_TOKEN_TYPE,
        amount: 10,
        signature: ALICE_ADDRESS,
        createdAccountPubkey: BOB_ADDRESS,
      }
      const snaps: StateSnapshot[] = await rollupGuard.getInputStateSnapshots(
        creationTransition
      )
      // make sure the right root was pulled
      snaps[0].stateRoot.should.equal(genesisStateRoot.replace('0x', ''))
      snaps[1].stateRoot.should.equal(genesisStateRoot.replace('0x', ''))
      // make sure the right pubkeys were pulled
      snaps[0].state.pubkey.should.equal(ALICE_ADDRESS)
      assert(
        snaps[1].state === undefined,
        'Empty slot should give an undefined state.'
      )
    })
  })

  describe('checkNextTransition', () => {
    it('should return no fraud if correct root for transfer', async () => {
      // create a valid transfer from genesis
      const transitionAliceToBob: TransferTransition = {
        stateRoot:
          '0x68cb03c6cace1db3a6f7e58db36e8e480ade32e1cba9451a0a63a750b8c48e1a',
        senderSlotIndex: ALICE_GENESIS_STATE_INDEX,
        recipientSlotIndex: BOB_GENESIS_STATE_INDEX,
        tokenType: 0,
        amount: 100,
        signature: ALICE_ADDRESS,
      }
      // test checking this individual transition
      const res: LocalFraudProof = await rollupGuard.checkNextTransition(
        transitionAliceToBob
      )
      assert(
        res === undefined,
        'Fraud should not be detected for this valid transition.'
      )
    })

    it('should return no fraud if correct root for swap', async () => {
      // create a valid swap from genesis
      const transitionAliceSwap: SwapTransition = {
        stateRoot:
          '0x351f9762c0826a3c53eb990d3b69f6f27d6a8793b29f2edf825658065f7a991e',
        senderSlotIndex: ALICE_GENESIS_STATE_INDEX,
        uniswapSlotIndex: UNISWAP_GENESIS_STATE_INDEX,
        tokenType: UNI_TOKEN_TYPE,
        inputAmount: 100,
        minOutputAmount: 20,
        timeout: 10,
        signature: ALICE_ADDRESS,
      }
      // test checking this individual transition
      const res: LocalFraudProof = await rollupGuard.checkNextTransition(
        transitionAliceSwap
      )
      assert(
        res === undefined,
        'Fraud should not be detected for this valid transition.'
      )
    })

    it('should return no fraud if correct root for creation transition', async () => {
      // create a valid create-and-transfer transition from genesis
      const transitionAliceToCreatedBob: CreateAndTransferTransition = {
        stateRoot:
          '0x24a9c3fdd45a8fadb92d89ab74bb249edbe9a415f1d82a488c2efc5372979710',
        senderSlotIndex: ALICE_GENESIS_STATE_INDEX,
        recipientSlotIndex: 4, // genesis fills first few
        tokenType: 0,
        amount: 100,
        signature: ALICE_ADDRESS,
        createdAccountPubkey: '0x0100000000000000000000000000000000000000',
      }
      // test checking this individual transition
      const res: LocalFraudProof = await rollupGuard.checkNextTransition(
        transitionAliceToCreatedBob
      )
      assert(
        res === undefined,
        'Fraud should not be detected for this valid transition.'
      )
    })

    it('should return positive for fraud if transition has invalid root', async () => {
      // create an invalid deadbeef post root transition
      const transitionAliceSwap: SwapTransition = {
        stateRoot:
          '0xdeadbeefb833c9e1086ded944c9fbe011248203e586d81f9fe0922434632dcde',
        senderSlotIndex: ALICE_GENESIS_STATE_INDEX,
        uniswapSlotIndex: UNISWAP_GENESIS_STATE_INDEX,
        tokenType: UNI_TOKEN_TYPE,
        inputAmount: 100,
        minOutputAmount: 20,
        timeout: 10,
        signature: ALICE_ADDRESS,
      }
      // test checking this individual transition
      const res: LocalFraudProof = await rollupGuard.checkNextTransition(
        transitionAliceSwap
      )
      res.should.not.equal(undefined)
    })
    it("should let us know we can't currently validate if accounts are not created sequentially", async () => {
      // create a transition which we can't generate a fraud proof yet
      const outOfOrderCreation: CreateAndTransferTransition = {
        stateRoot:
          '0x8bb6f1bd59e26928f8f1531af52224d59d76d6951db31c403bf1e215c99372e6',
        senderSlotIndex: ALICE_GENESIS_STATE_INDEX,
        recipientSlotIndex: 300, // not suported yet, only sequential
        tokenType: 0,
        amount: 100,
        signature: ALICE_ADDRESS,
        createdAccountPubkey: '0x0100000000000000000000000000000000000000',
      }

      try {
        await rollupGuard.checkNextTransition(outOfOrderCreation)
      } catch (error) {
        // Make sure we recognized the right error
        error.should.be.instanceOf(AggregatorUnsupportedError)
        return
      }
      false.should.equal(true) // we should never get here!
    })
  })

  describe('checkNextBlock', () => {
    it('should throw if it recieves blocks out of order', async () => {
      // create a block with num =/= 0 which cannot be processed before 0-4
      const blockNumber: number = 5
      const wrongOrderBlock: RollupBlock = {
        blockNumber,
        transitions: undefined,
      }
      // store the block
      await rollupGuard.storeBlock(wrongOrderBlock)
      // try to validate it
      try {
        await rollupGuard.validateStoredBlock(blockNumber)
      } catch (e) {
        e.should.be.an.instanceOf(ValidationOutOfOrderError)
      }
    })
    it('should successfully validate a send followed by a swap', async () => {
      // create a svalid end
      const transitionAliceToBob: TransferTransition = {
        stateRoot:
          '0x68cb03c6cace1db3a6f7e58db36e8e480ade32e1cba9451a0a63a750b8c48e1a',
        senderSlotIndex: ALICE_GENESIS_STATE_INDEX,
        recipientSlotIndex: BOB_GENESIS_STATE_INDEX,
        tokenType: 0,
        amount: 100,
        signature: ALICE_ADDRESS,
      }
      // create a valid swap
      const transitionAliceSwap: SwapTransition = {
        stateRoot:
          '0x0ae582fd70c6fa55ced00cc5a7f5a0f0e0d68447ee7ece74d841548142ba9d32',
        senderSlotIndex: ALICE_GENESIS_STATE_INDEX,
        uniswapSlotIndex: UNISWAP_GENESIS_STATE_INDEX,
        tokenType: UNI_TOKEN_TYPE,
        inputAmount: 100,
        minOutputAmount: 20,
        timeout: 10,
        signature: ALICE_ADDRESS,
      }
      // create the block
      const blockNumber: number = 0
      const sendThenSwapBlock: RollupBlock = {
        blockNumber,
        transitions: [transitionAliceToBob, transitionAliceSwap],
      }
      // store the block
      await rollupGuard.storeBlock(sendThenSwapBlock)
      // validate it
      const res: ContractFraudProof = await rollupGuard.validateStoredBlock(
        blockNumber
      )
      assert(
        res === undefined,
        'Fraud should not be detected for this valid transition.'
      )
    })
    it('should successfully get a fraud proof for a valid transition followed by another with invalid root', async () => {
      // create valid transition from genesis
      const transitionAliceToBob: TransferTransition = {
        stateRoot:
          '0x68cb03c6cace1db3a6f7e58db36e8e480ade32e1cba9451a0a63a750b8c48e1a',
        senderSlotIndex: ALICE_GENESIS_STATE_INDEX,
        recipientSlotIndex: BOB_GENESIS_STATE_INDEX,
        tokenType: 0,
        amount: 100,
        signature: ALICE_ADDRESS,
      }
      // create transition with deadbeef post root
      const transitionAliceSwap: SwapTransition = {
        stateRoot:
          '0xdeadbeef3b1531efd3fa80ce5698f5838e45c62efca5ecde0152f9b165ce6813',
        senderSlotIndex: ALICE_GENESIS_STATE_INDEX,
        uniswapSlotIndex: UNISWAP_GENESIS_STATE_INDEX,
        tokenType: UNI_TOKEN_TYPE,
        inputAmount: 100,
        minOutputAmount: 20,
        timeout: 10,
        signature: ALICE_ADDRESS,
      }
      // create block
      const blockNumber: number = 0
      const sendThenSwapBlock: RollupBlock = {
        blockNumber,
        transitions: [transitionAliceToBob, transitionAliceSwap],
      }
      // store it
      await rollupGuard.storeBlock(sendThenSwapBlock)
      // check it, expecting fraud
      const res: ContractFraudProof = await rollupGuard.validateStoredBlock(
        blockNumber
      )
      res.should.not.equal(undefined)
    })
    it('should return a fraud proof for a block with an invalid initial tx', async () => {
      // create a valid transaction for block 0
      const transitionAliceToBob: TransferTransition = {
        stateRoot:
          '0x68cb03c6cace1db3a6f7e58db36e8e480ade32e1cba9451a0a63a750b8c48e1a',
        senderSlotIndex: ALICE_GENESIS_STATE_INDEX,
        recipientSlotIndex: BOB_GENESIS_STATE_INDEX,
        tokenType: 0,
        amount: 100,
        signature: ALICE_ADDRESS,
      }
      // create another valid transaction for block 0
      const transitionAliceSwap: SwapTransition = {
        stateRoot:
          '0x0ae582fd70c6fa55ced00cc5a7f5a0f0e0d68447ee7ece74d841548142ba9d32',
        senderSlotIndex: ALICE_GENESIS_STATE_INDEX,
        uniswapSlotIndex: UNISWAP_GENESIS_STATE_INDEX,
        tokenType: UNI_TOKEN_TYPE,
        inputAmount: 100,
        minOutputAmount: 20,
        timeout: 10,
        signature: ALICE_ADDRESS,
      }
      // create valid block 0
      const validFirstBlock: RollupBlock = {
        blockNumber: 0,
        transitions: [transitionAliceToBob, transitionAliceSwap],
      }
      // create an invalid state transition for block 1
      const invalidSendTransition: TransferTransition = {
        stateRoot:
          '0xdeadbeef000000efd3fa80ce5698f5838e45c62efca5ecde0152f9b165ce6813',
        senderSlotIndex: ALICE_GENESIS_STATE_INDEX,
        recipientSlotIndex: BOB_GENESIS_STATE_INDEX,
        tokenType: 0,
        amount: 100,
        signature: ALICE_ADDRESS,
      }
      // create invalid block 1
      const invalidFirstTransitionBlock: RollupBlock = {
        blockNumber: 1,
        transitions: [
          invalidSendTransition,
          invalidSendTransition, // there could be multiple invalid transitions, but we need to confirm we get the first.
          invalidSendTransition,
        ],
      }
      // store and validate the first valid block 0
      await rollupGuard.storeBlock(validFirstBlock)
      await rollupGuard.validateStoredBlock(0)
      // store and validate the invalid block 1
      await rollupGuard.storeBlock(invalidFirstTransitionBlock)
      const res: ContractFraudProof = await rollupGuard.validateStoredBlock(1)
      // Fraud roof should give last transition of block 0 and the first transition of block 1
      res[0].inclusionProof.transitionIndex.should.equal(1)
      res[0].inclusionProof.blockNumber.should.equal(0)
      res[1].inclusionProof.transitionIndex.should.equal(0)
      res[1].inclusionProof.blockNumber.should.equal(1)
    })
  })
})
