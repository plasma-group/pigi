import '../../setup'

/* External Imports */
import debug from 'debug'
const log = debug('test:info:state-manager')
import BigNum = require('bn.js')
import {
  DefaultStateDB,
  DefaultStateManager,
  ONE,
  stateUpdatesEqual,
} from '../../../src/app'
import {
  PluginManager,
  PredicatePlugin,
  Range,
  StateDB,
  StateManager,
  StateObject,
  StateUpdate,
  Transaction,
  TransactionResult,
  VerifiedStateUpdate,
} from '../../../src/types'
import * as assert from 'assert'

/*******************
 * Mocks & Helpers *
 *******************/

class DummyPluginManager implements PluginManager {
  public getPlugin(address: string): Promise<PredicatePlugin | undefined> {
    return undefined
  }

  public loadPlugin(address: string, path: string): Promise<PredicatePlugin> {
    return undefined
  }
}

class DummyPredicatePlugin implements PredicatePlugin {
  public executeStateTransition(
    previousStateUpdate: StateUpdate,
    transaction: Transaction,
    witness: string = 'none'
  ): Promise<StateObject> {
    return undefined
  }
}

function getPluginThatReturns(stateObjects: StateObject[]): PredicatePlugin {
  const predicatePlugin: PredicatePlugin = new DummyPredicatePlugin()
  predicatePlugin.executeStateTransition = async (
    previousStateUpdate: StateUpdate,
    transaction: Transaction,
    witness: string = 'none'
  ): Promise<StateObject> => {
    if (stateObjects.length > 1) {
      return stateObjects.shift()
    }
    return stateObjects[0]
  }
  return predicatePlugin
}

function getPluginManagerThatReturns(
  pluginMap: Map<string, PredicatePlugin>
): PluginManager {
  const pluginManager: PluginManager = new DummyPluginManager()
  pluginManager.getPlugin = async (
    address: string
  ): Promise<PredicatePlugin | undefined> => {
    return pluginMap.get(address)
  }
  return pluginManager
}

function getStateDBThatReturns(
  verifiedStateUpdates: VerifiedStateUpdate[]
): StateDB {
  const stateDB = new DefaultStateDB()
  stateDB.getVerifiedStateUpdates = async (
    start: BigNum,
    end: BigNum
  ): Promise<VerifiedStateUpdate[]> => {
    return verifiedStateUpdates
  }
  return stateDB
}

function getStateUpdate(
  start: BigNum,
  end: BigNum,
  plasmaBlockNumber: BigNum,
  stateObject: StateObject,
  depositAddress: string = '0x1234'
): StateUpdate {
  return {
    range: {
      start,
      end,
    },
    stateObject,
    depositAddress,
    plasmaBlockNumber: new BigNum(plasmaBlockNumber),
  }
}

function getVerifiedStateUpdate(
  start: BigNum,
  end: BigNum,
  block: BigNum,
  depositAddress: string,
  predicateAddress: string,
  data: any = { dummyData: false }
): VerifiedStateUpdate {
  return {
    range: {
      start,
      end,
    },
    verifiedBlockNumber: block,
    stateUpdate: getStateUpdate(
      start,
      end,
      block,
      { predicateAddress, data },
      depositAddress
    ),
  }
}

function getTransaction(
  depositAddress: string,
  start: BigNum,
  end: BigNum,
  body: any = { dummyData: false }
) {
  return {
    depositAddress,
    body,
    range: {
      start,
      end,
    },
  }
}

/*********
 * TESTS *
 *********/

describe('DefaultStateManager', () => {
  describe('Construction', () => {
    it('should initialize', async () => {
      new DefaultStateManager(new DefaultStateDB(), new DummyPluginManager())
    })
  })

  describe('executeTransaction', () => {
    const start: BigNum = new BigNum(10)
    const end: BigNum = new BigNum(20)
    const defaultWitness: string = 'none'
    const previousBlockNumber: BigNum = new BigNum(10)
    const nextBlockNumber: BigNum = new BigNum(11)
    const depositAddress = '0x1234'
    const predicateAddress = '0x12345678'
    const defaultEndData = { testResult: 'test' }

    const transaction: Transaction = getTransaction(depositAddress, start, end)
    const endStateObject: StateObject = {
      predicateAddress,
      data: defaultEndData,
    }

    const endStateUpdate: StateUpdate = getStateUpdate(
      start,
      end,
      nextBlockNumber,
      endStateObject,
      depositAddress
    )

    it('should process simple transaction for contiguous range', async () => {
      const verifiedStateUpdates: VerifiedStateUpdate[] = [
        getVerifiedStateUpdate(
          start,
          end,
          previousBlockNumber,
          depositAddress,
          predicateAddress
        ),
      ]

      const plugin: PredicatePlugin = getPluginThatReturns([endStateObject])

      const stateDB: StateDB = getStateDBThatReturns(verifiedStateUpdates)
      const pluginManager: PluginManager = getPluginManagerThatReturns(
        new Map<string, PredicatePlugin>([[predicateAddress, plugin]])
      )
      const stateManager: StateManager = new DefaultStateManager(
        stateDB,
        pluginManager
      )

      const result: TransactionResult = await stateManager.executeTransaction(
        transaction,
        nextBlockNumber,
        defaultWitness
      )

      assert(stateUpdatesEqual(result.stateUpdate, endStateUpdate))

      result.validRanges.length.should.equal(1)
      result.validRanges[0].start.should.equal(start)
      result.validRanges[0].end.should.equal(end)
    })

    it('should process complex transaction for contiguous range', async () => {
      const midPoint = end
        .sub(start)
        .divRound(new BigNum(2))
        .add(start)
      const verifiedStateUpdates: VerifiedStateUpdate[] = [
        getVerifiedStateUpdate(
          start,
          midPoint,
          previousBlockNumber,
          depositAddress,
          predicateAddress
        ),
        getVerifiedStateUpdate(
          midPoint,
          end,
          previousBlockNumber,
          depositAddress,
          predicateAddress
        ),
      ]

      const plugin: PredicatePlugin = getPluginThatReturns([endStateObject])

      const stateDB: StateDB = getStateDBThatReturns(verifiedStateUpdates)
      const pluginManager: PluginManager = getPluginManagerThatReturns(
        new Map<string, PredicatePlugin>([[predicateAddress, plugin]])
      )
      const stateManager: StateManager = new DefaultStateManager(
        stateDB,
        pluginManager
      )

      const result: TransactionResult = await stateManager.executeTransaction(
        transaction,
        nextBlockNumber,
        defaultWitness
      )

      assert(stateUpdatesEqual(result.stateUpdate, endStateUpdate))

      result.validRanges.length.should.equal(2)
      result.validRanges[0].start.should.equal(start)
      result.validRanges[0].end.should.equal(midPoint)
      result.validRanges[1].start.should.equal(midPoint)
      result.validRanges[1].end.should.equal(end)
    })

    it('should process complex transaction for non-subset range', async () => {
      const midPoint = end
        .sub(start)
        .divRound(new BigNum(2))
        .add(start)
      const verifiedStateUpdates: VerifiedStateUpdate[] = [
        getVerifiedStateUpdate(
          start.sub(new BigNum(5)),
          midPoint,
          previousBlockNumber,
          depositAddress,
          predicateAddress
        ),
        getVerifiedStateUpdate(
          midPoint,
          end.add(new BigNum(4)),
          previousBlockNumber,
          depositAddress,
          predicateAddress
        ),
      ]

      const plugin: PredicatePlugin = getPluginThatReturns([endStateObject])

      const stateDB: StateDB = getStateDBThatReturns(verifiedStateUpdates)
      const pluginManager: PluginManager = getPluginManagerThatReturns(
        new Map<string, PredicatePlugin>([[predicateAddress, plugin]])
      )
      const stateManager: StateManager = new DefaultStateManager(
        stateDB,
        pluginManager
      )

      const result: TransactionResult = await stateManager.executeTransaction(
        transaction,
        nextBlockNumber,
        defaultWitness
      )

      assert(stateUpdatesEqual(result.stateUpdate, endStateUpdate))

      result.validRanges.length.should.equal(2)
      result.validRanges[0].start.should.equal(start)
      result.validRanges[0].end.should.equal(midPoint)
      result.validRanges[1].start.should.equal(midPoint)
      result.validRanges[1].end.should.equal(end)
    })

    it('should process complex transaction for non-contiguous range', async () => {
      const endRange1: BigNum = start.add(new BigNum(1))
      const startRange2: BigNum = end.sub(new BigNum(1))
      const verifiedStateUpdates: VerifiedStateUpdate[] = [
        getVerifiedStateUpdate(
          start,
          endRange1,
          previousBlockNumber,
          depositAddress,
          predicateAddress
        ),
        getVerifiedStateUpdate(
          startRange2,
          end,
          previousBlockNumber,
          depositAddress,
          predicateAddress
        ),
      ]

      const plugin: PredicatePlugin = getPluginThatReturns([endStateObject])

      const stateDB: StateDB = getStateDBThatReturns(verifiedStateUpdates)
      const pluginManager: PluginManager = getPluginManagerThatReturns(
        new Map<string, PredicatePlugin>([[predicateAddress, plugin]])
      )
      const stateManager: StateManager = new DefaultStateManager(
        stateDB,
        pluginManager
      )

      const result: TransactionResult = await stateManager.executeTransaction(
        transaction,
        nextBlockNumber,
        defaultWitness
      )

      assert(stateUpdatesEqual(result.stateUpdate, endStateUpdate))

      result.validRanges.length.should.equal(2)
      result.validRanges[0].start.should.equal(start)
      result.validRanges[0].end.should.equal(endRange1)
      result.validRanges[1].start.should.equal(startRange2)
      result.validRanges[1].end.should.equal(end)
    })

    it('should return empty range if no VerifiedStateUpdates', async () => {
      const verifiedStateUpdates: VerifiedStateUpdate[] = []

      // This should never be called
      const plugin: PredicatePlugin = undefined

      const stateDB: StateDB = getStateDBThatReturns(verifiedStateUpdates)
      const pluginManager: PluginManager = getPluginManagerThatReturns(
        new Map<string, PredicatePlugin>([[predicateAddress, plugin]])
      )
      const stateManager: StateManager = new DefaultStateManager(
        stateDB,
        pluginManager
      )

      const result: TransactionResult = await stateManager.executeTransaction(
        transaction,
        nextBlockNumber,
        defaultWitness
      )

      assert(result.stateUpdate === undefined)
      result.validRanges.length.should.equal(0)
    })

    it('should return empty range if VerifiedStateUpdates do not overlap', async () => {
      const verifiedStateUpdates: VerifiedStateUpdate[] = [
        getVerifiedStateUpdate(
          end,
          end.add(new BigNum(1)),
          previousBlockNumber,
          depositAddress,
          predicateAddress
        ),
        getVerifiedStateUpdate(
          start.sub(new BigNum(1)),
          start,
          previousBlockNumber,
          depositAddress,
          predicateAddress
        ),
      ]

      const plugin: PredicatePlugin = getPluginThatReturns([endStateObject])

      const stateDB: StateDB = getStateDBThatReturns(verifiedStateUpdates)
      const pluginManager: PluginManager = getPluginManagerThatReturns(
        new Map<string, PredicatePlugin>([[predicateAddress, plugin]])
      )
      const stateManager: StateManager = new DefaultStateManager(
        stateDB,
        pluginManager
      )

      try {
        await stateManager.executeTransaction(
          transaction,
          nextBlockNumber,
          defaultWitness
        )
        assert(false, 'this call should have thrown an error.')
      } catch (e) {
        assert(true, 'this call threw an error as expected.')
      }
    })

    it('should throw if VerifiedStateUpdates have different predicates', async () => {
      const secondPredicateAddress = '0x87654321'
      const midPoint = end
        .sub(start)
        .divRound(new BigNum(2))
        .add(start)
      const verifiedStateUpdates: VerifiedStateUpdate[] = [
        getVerifiedStateUpdate(
          start,
          midPoint,
          previousBlockNumber,
          depositAddress,
          predicateAddress
        ),
        getVerifiedStateUpdate(
          midPoint,
          end,
          previousBlockNumber,
          depositAddress,
          predicateAddress
        ),
      ]

      const firstStateObject: StateObject = {
        predicateAddress,
        data: { testResult: 'test' },
      }

      const plugin: PredicatePlugin = getPluginThatReturns([firstStateObject])

      const secondStateObject: StateObject = {
        predicateAddress: secondPredicateAddress,
        data: { testResult: 'test' },
      }
      const secondPlugin: PredicatePlugin = getPluginThatReturns([
        secondStateObject,
      ])

      const stateDB: StateDB = getStateDBThatReturns(verifiedStateUpdates)
      const pluginManager: PluginManager = getPluginManagerThatReturns(
        new Map<string, PredicatePlugin>([
          [predicateAddress, plugin],
          [secondPredicateAddress, secondPlugin],
        ])
      )
      const stateManager: StateManager = new DefaultStateManager(
        stateDB,
        pluginManager
      )

      try {
        await stateManager.executeTransaction(
          transaction,
          nextBlockNumber,
          defaultWitness
        )
        assert(false, 'this call should have thrown an error.')
      } catch (e) {
        assert(true, 'this call threw an error as expected.')
      }
    })

    it('should fail if same predicate but StateObjects do not match', async () => {
      const midPoint = end
        .sub(start)
        .divRound(new BigNum(2))
        .add(start)
      const verifiedStateUpdates: VerifiedStateUpdate[] = [
        getVerifiedStateUpdate(
          start,
          midPoint,
          previousBlockNumber,
          depositAddress,
          predicateAddress
        ),
        getVerifiedStateUpdate(
          midPoint,
          end,
          previousBlockNumber,
          depositAddress,
          predicateAddress
        ),
      ]

      const firstStateObject: StateObject = {
        predicateAddress,
        data: { testResult: 'test' },
      }

      const secondStateObject: StateObject = {
        predicateAddress,
        data: { testResult: 'test 2' },
      }
      const plugin: PredicatePlugin = getPluginThatReturns([
        firstStateObject,
        secondStateObject,
      ])

      const stateDB: StateDB = getStateDBThatReturns(verifiedStateUpdates)
      const pluginManager: PluginManager = getPluginManagerThatReturns(
        new Map<string, PredicatePlugin>([[predicateAddress, plugin]])
      )
      const stateManager: StateManager = new DefaultStateManager(
        stateDB,
        pluginManager
      )

      try {
        await stateManager.executeTransaction(
          transaction,
          nextBlockNumber,
          defaultWitness
        )
        assert(false, 'this call should have thrown an error.')
      } catch (e) {
        assert(true, 'this call threw an error as expected.')
      }
    })

    it('should throw if block number is incorrect', async () => {
      const verifiedStateUpdates: VerifiedStateUpdate[] = [
        getVerifiedStateUpdate(
          start,
          end,
          previousBlockNumber,
          depositAddress,
          predicateAddress
        ),
      ]

      const plugin: PredicatePlugin = getPluginThatReturns([endStateObject])

      const stateDB: StateDB = getStateDBThatReturns(verifiedStateUpdates)
      const pluginManager: PluginManager = getPluginManagerThatReturns(
        new Map<string, PredicatePlugin>([[predicateAddress, plugin]])
      )
      const stateManager: StateManager = new DefaultStateManager(
        stateDB,
        pluginManager
      )

      try {
        await stateManager.executeTransaction(
          transaction,
          nextBlockNumber.add(ONE),
          defaultWitness
        )
        assert(false, 'this call should have thrown an error.')
      } catch (e) {
        assert(true, 'this call threw an error as expected.')
      }
    })
  })
})
