import '../../setup'

/* External Imports */
import {
  HashAlgorithm,
  HashFunction,
  keccak256,
  serializeObject,
} from '@pigi/core-utils'
import { DBInterface, newInMemoryDB } from '@pigi/core-db'
import * as assert from 'assert'

/* Internal Imports */
import {
  CannotDecideError,
  HashPreimageExistenceDecider,
  Decision,
  HashPreimageDBInterface,
  ImplicationProofItem,
  HashPreimageDB,
} from '../../../src'

describe('HashPreimageExistenceDecider', () => {
  const preimage: string = Buffer.from('really great preimage').toString('hex')
  const hashFunction: HashFunction = keccak256
  const hash: string = hashFunction(preimage)
  const hashAlgorithm: HashAlgorithm = HashAlgorithm.KECCAK256
  const notTheHashAlgorithm: HashAlgorithm = HashAlgorithm.MD5

  describe('Constructor', () => {
    it('should initialize', async () => {
      new HashPreimageExistenceDecider(
        new HashPreimageDB(newInMemoryDB()),
        hashAlgorithm
      )
    })
  })

  describe('decide', () => {
    let decider: HashPreimageExistenceDecider
    let preimageDB: HashPreimageDBInterface
    let db: DBInterface

    beforeEach(() => {
      db = newInMemoryDB()
      preimageDB = new HashPreimageDB(db)
      decider = new HashPreimageExistenceDecider(preimageDB, hashAlgorithm)
    })

    it('should decide true for valid preimage', async () => {
      await preimageDB.storePreimage(preimage, hashAlgorithm)
      const decision: Decision = await decider.decide({ hash })

      decision.outcome.should.equal(true)
      decision.justification.length.should.equal(1)

      const justification: ImplicationProofItem = decision.justification[0]
      justification.implication.decider.should.equal(decider)
      justification.implication.input['hash'].should.equal(hash)
      assert(
        justification.implicationWitness['preimage'] === preimage,
        `Justification preimage should equal expected preimage [${preimage.toString()}], but got [${justification.implicationWitness[
          'preimage'
        ].toString()}]`
      )
    })

    it('should decide true for valid preimage from Message', async () => {
      await preimageDB.handleMessage(
        serializeObject({
          channelID: 'chan',
          data: { preimage },
        })
      )
      const decision: Decision = await decider.decide({ hash })

      decision.outcome.should.equal(true)
      decision.justification.length.should.equal(1)

      const justification: ImplicationProofItem = decision.justification[0]
      justification.implication.decider.should.equal(decider)
      justification.implication.input['hash'].should.equal(hash)
      assert(
        justification.implicationWitness['preimage'] === preimage,
        `Justification preimage should equal expected preimage [${preimage.toString()}], but got [${justification.implicationWitness[
          'preimage'
        ].toString()}]`
      )
    })

    it('should take hash algorithm into account', async () => {
      await preimageDB.storePreimage(preimage, notTheHashAlgorithm)
      try {
        await decider.decide({ hash })
        assert(false, 'This should have thrown')
      } catch (e) {
        if (!(e instanceof CannotDecideError)) {
          throw e
        }
      }
    })

    it('should throw when no preimages exist', async () => {
      try {
        await decider.decide({ hash })
        assert(false, 'This should have thrown')
      } catch (e) {
        if (!(e instanceof CannotDecideError)) {
          throw e
        }
      }
    })

    it('should throw invalid preimage', async () => {
      const wompwomp: string = Buffer.from('womp womp').toString('hex')
      await preimageDB.storePreimage(wompwomp, hashAlgorithm)
      try {
        await decider.decide({ hash })
        assert(false, 'This should have thrown')
      } catch (e) {
        if (!(e instanceof CannotDecideError)) {
          throw e
        }
      }
    })

    it('should work with multiple Decisions that have been made', async () => {
      await preimageDB.storePreimage(preimage, hashAlgorithm)
      await decider.decide({ hash })

      const secondPreimage: string = Buffer.from(
        'Another great preimage!'
      ).toString('hex')
      await preimageDB.storePreimage(secondPreimage, hashAlgorithm)

      const secondHash: string = hashFunction(secondPreimage)
      await decider.decide({ hash: secondHash })

      const checkedDecision: Decision = await decider.decide({ hash })

      checkedDecision.outcome.should.equal(true)
      checkedDecision.justification.length.should.equal(1)

      let justification: ImplicationProofItem = checkedDecision.justification[0]
      justification.implication.decider.should.equal(decider)
      assert(
        justification.implication.input['hash'] === hash,
        'decided hash is not what it should be'
      )
      assert(
        justification.implicationWitness['preimage'] === preimage,
        'decided preimage is not what it should be'
      )

      const secondCheckedDecision: Decision = await decider.decide({
        hash: secondHash,
      })

      secondCheckedDecision.outcome.should.equal(true)
      secondCheckedDecision.justification.length.should.equal(1)

      justification = secondCheckedDecision.justification[0]
      justification.implication.decider.should.equal(decider)
      assert(
        justification.implication.input['hash'] === secondHash,
        'second decided hash is not what it should be'
      )
      assert(
        justification.implicationWitness['preimage'] === secondPreimage,
        'second decided preimage is not what it should be'
      )
    })
  })
})
