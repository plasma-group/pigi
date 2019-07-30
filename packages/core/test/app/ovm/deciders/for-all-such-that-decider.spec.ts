import '../../../setup'

import {
  ForAllSuchThatDecider,
  ForAllSuchThatInput,
  CannotDecideError,
} from '../../../../src/app/ovm/deciders'
import { CannotDecideDecider, FalseDecider, TrueDecider } from './utils'
import {
  Decision,
  Property,
  PropertyFactory,
  Quantifier,
  QuantifierResult,
} from '../../../../src/types/ovm'
import * as assert from 'assert'

/*******************
 * Mocks & Helpers *
 *******************/

class DummyQuantifier implements Quantifier {
  public async getAllQuantified(parameters: any): Promise<QuantifierResult> {
    return undefined
  }
}

const getQuantifierThatReturns = (
  results: any[],
  allResultsQuantified: boolean
): Quantifier => {
  const quantifier: Quantifier = new DummyQuantifier()
  quantifier.getAllQuantified = async (params): Promise<QuantifierResult> => {
    return {
      results,
      allResultsQuantified,
    }
  }
  return quantifier
}

const getPropertyFactoryThatReturns = (
  properties: Property[]
): PropertyFactory => {
  return (input: any): Property => {
    return properties.shift()
  }
}

/*********
 * TESTS *
 *********/

describe('ForAllSuchThatDecider', () => {
  let decider: ForAllSuchThatDecider

  const trueDecider: TrueDecider = new TrueDecider()
  const falseDecider: FalseDecider = new FalseDecider()
  const cannotDecideDecider: CannotDecideDecider = new CannotDecideDecider()
  beforeEach(() => {
    decider = new ForAllSuchThatDecider()
  })

  const testReturnTrueWithNoDeciders = async (
    isDecide: boolean = true
  ) => {
    const input: ForAllSuchThatInput = {
      quantifier: getQuantifierThatReturns([], true),
      quantifierParameters: undefined,
      propertyFactory: getPropertyFactoryThatReturns([]),
    }

    const decision: Decision = isDecide
      ? await decider.decide(input, undefined)
      : await decider.checkDecision(input)

    decision.outcome.should.eq(true)
    decision.justification.length.should.eq(1)
    decision.justification[0].implication.decider.should.eq(decider)
  }

  const testReturnTrueWithASingleTrueDecider = async (
    isDecide: boolean = true
  ) => {
    const input: ForAllSuchThatInput = {
      quantifier: getQuantifierThatReturns([1], true),
      quantifierParameters: undefined,
      propertyFactory: getPropertyFactoryThatReturns([
        { decider: trueDecider, input: undefined },
      ]),
    }

    const decision: Decision = isDecide
      ? await decider.decide(input, undefined)
      : await decider.checkDecision(input)

    decision.outcome.should.eq(true)
    decision.justification.length.should.eq(2)
    decision.justification[0].implication.decider.should.eq(decider)
    decision.justification[1].implication.decider.should.eq(trueDecider)
  }

  const testReturnTrueWithMultipleTrueDeciders = async (
    isDecide: boolean = true
  ) => {
    const input: ForAllSuchThatInput = {
      quantifier: getQuantifierThatReturns([1, 2, 3], true),
      quantifierParameters: undefined,
      propertyFactory: getPropertyFactoryThatReturns([
        { decider: trueDecider, input: undefined },
        { decider: trueDecider, input: undefined },
        { decider: trueDecider, input: undefined },
      ]),
    }

    const decision: Decision = isDecide
      ? await decider.decide(input, undefined)
      : await decider.checkDecision(input)

    decision.outcome.should.eq(true)
    decision.justification.length.should.eq(4)
    decision.justification[0].implication.decider.should.eq(decider)
    decision.justification[1].implication.decider.should.eq(trueDecider)
    decision.justification[2].implication.decider.should.eq(trueDecider)
    decision.justification[3].implication.decider.should.eq(trueDecider)
  }

  const testReturnFalseWithASingleFalseDecider = async (
    isDecide: boolean = true
  ) => {
    const input: ForAllSuchThatInput = {
      quantifier: getQuantifierThatReturns([1], true),
      quantifierParameters: undefined,
      propertyFactory: getPropertyFactoryThatReturns([
        { decider: falseDecider, input: undefined },
      ]),
    }

    const decision: Decision = isDecide
      ? await decider.decide(input, undefined)
      : await decider.checkDecision(input)

    decision.outcome.should.eq(false)
    decision.justification.length.should.eq(2)
    decision.justification[0].implication.decider.should.eq(decider)
    decision.justification[1].implication.decider.should.eq(falseDecider)
  }

  const testReturnFalseWithSingleFalseInMultipleDeciders = async (
    isDecide: boolean = true
  ) => {
    const input: ForAllSuchThatInput = {
      quantifier: getQuantifierThatReturns([1, 2, 3], true),
      quantifierParameters: undefined,
      propertyFactory: getPropertyFactoryThatReturns([
        { decider: trueDecider, input: undefined },
        { decider: falseDecider, input: undefined },
        { decider: trueDecider, input: undefined },
      ]),
    }

    const decision: Decision = isDecide
      ? await decider.decide(input, undefined)
      : await decider.checkDecision(input)

    decision.outcome.should.eq(false)
    decision.justification.length.should.eq(2)
    decision.justification[0].implication.decider.should.eq(decider)
    decision.justification[1].implication.decider.should.eq(falseDecider)
  }

  const testFalseWithSingleFalseInMultipleDecidersWithTrueAndUndecided = async (
    isDecide: boolean = true
  ) => {
    const input: ForAllSuchThatInput = {
      quantifier: getQuantifierThatReturns([1, 2, 3], true),
      quantifierParameters: undefined,
      propertyFactory: getPropertyFactoryThatReturns([
        { decider: trueDecider, input: undefined },
        { decider: cannotDecideDecider, input: undefined },
        { decider: falseDecider, input: undefined },
      ]),
    }

    const decision: Decision = isDecide
      ? await decider.decide(input, undefined)
      : await decider.checkDecision(input)

    decision.outcome.should.eq(false)
    decision.justification.length.should.eq(2)
    decision.justification[0].implication.decider.should.eq(decider)
    decision.justification[1].implication.decider.should.eq(falseDecider)
  }

  const testThrowCannotDecideWithASingleUndecided = async (
    isDecide: boolean = true
  ) => {
    const input: ForAllSuchThatInput = {
      quantifier: getQuantifierThatReturns([1], true),
      quantifierParameters: undefined,
      propertyFactory: getPropertyFactoryThatReturns([
        { decider: cannotDecideDecider, input: undefined },
      ]),
    }

    try {
      const decision: Decision = isDecide
        ? await decider.decide(input, undefined)
        : await decider.checkDecision(input)
      assert(false, 'this should have thrown')
    } catch (e) {
      if (!(e instanceof CannotDecideError)) {
        assert(
          false,
          `CannotDecideError expected, but got ${JSON.stringify(e)}`
        )
      }
    }
  }

  const testThrowCannotDecideWithASingleInMultipleDeciders = async (
    isDecide: boolean = true
  ) => {
    const input: ForAllSuchThatInput = {
      quantifier: getQuantifierThatReturns([1, 2, 3], true),
      quantifierParameters: undefined,
      propertyFactory: getPropertyFactoryThatReturns([
        { decider: cannotDecideDecider, input: undefined },
        { decider: cannotDecideDecider, input: undefined },
        { decider: cannotDecideDecider, input: undefined },
      ]),
    }

    try {
      isDecide
        ? await decider.decide(input, undefined)
        : await decider.checkDecision(input)
      assert(false, 'this should have thrown')
    } catch (e) {
      if (!(e instanceof CannotDecideError)) {
        assert(
          false,
          `CannotDecideError expected, but got ${JSON.stringify(e)}`
        )
      }
    }
  }

  const testCannotDecideWithSingleUndecidedInMultipleDecidersWithTrueDecisions = async (
    isDecide: boolean = true
  ) => {
    const input: ForAllSuchThatInput = {
      quantifier: getQuantifierThatReturns([1, 2, 3], true),
      quantifierParameters: undefined,
      propertyFactory: getPropertyFactoryThatReturns([
        { decider: trueDecider, input: undefined },
        { decider: trueDecider, input: undefined },
        { decider: cannotDecideDecider, input: undefined },
      ]),
    }

    try {
      isDecide
        ? await decider.decide(input, undefined)
        : await decider.checkDecision(input)
      assert(false, 'this should have thrown')
    } catch (e) {
      if (!(e instanceof CannotDecideError)) {
        assert(
          false,
          `CannotDecideError expected, but got ${JSON.stringify(e)}`
        )
      }
    }
  }

  describe('decide', () => {
    it('should return true with 0 decisions', async () => {
      await testReturnTrueWithNoDeciders()
    })

    it('should return true with single true decision', async () => {
      await testReturnTrueWithASingleTrueDecider()
    })

    it('should return true with multiple true decisions', async () => {
      await testReturnTrueWithMultipleTrueDeciders()
    })

    it('should return false with a single false decision', async () => {
      await testReturnFalseWithASingleFalseDecider()
    })

    it('should return false with a single false decision in multiple deciders', async () => {
      await testReturnFalseWithSingleFalseInMultipleDeciders()
    })

    it('should return false with a single false decision in multiple deciders, some undecided', async () => {
      await testFalseWithSingleFalseInMultipleDecidersWithTrueAndUndecided()
    })

    it('should throw undecided with single undecided', async () => {
      await testThrowCannotDecideWithASingleUndecided()
    })

    it('should throw undecided with single undecided in multiple undecided', async () => {
      await testThrowCannotDecideWithASingleInMultipleDeciders()
    })

    it('should throw undecided with single undecided in multiple true', async () => {
      await testCannotDecideWithSingleUndecidedInMultipleDecidersWithTrueDecisions()
    })
  })

  describe('checkDecision', () => {
    it('should return true with 0 decisions', async () => {
      await testReturnTrueWithNoDeciders(false)
    })

    it('should return true with single true decision', async () => {
      await testReturnTrueWithASingleTrueDecider(false)
    })

    it('should return true with multiple true decisions', async () => {
      await testReturnTrueWithMultipleTrueDeciders(false)
    })

    it('should return false with a single false decision', async () => {
      await testReturnFalseWithASingleFalseDecider(false)
    })

    it('should return false with a single false decision in multiple deciders', async () => {
      await testReturnFalseWithSingleFalseInMultipleDeciders(false)
    })

    it('should return false with a single false decision in multiple deciders, some undecided', async () => {
      await testFalseWithSingleFalseInMultipleDecidersWithTrueAndUndecided(
        false
      )
    })

    it('should throw undecided with single undecided', async () => {
      await testThrowCannotDecideWithASingleUndecided(false)
    })

    it('should throw undecided with single undecided in multiple undecided', async () => {
      await testThrowCannotDecideWithASingleInMultipleDeciders(false)
    })

    it('should throw undecided with single undecided in multiple true', async () => {
      await testCannotDecideWithSingleUndecidedInMultipleDecidersWithTrueDecisions(
        false
      )
    })
  })
})
