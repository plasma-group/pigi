import '../../../setup'

import { AndDecider, CannotDecideError } from '../../../../src/app/ovm/deciders'
import { CannotDecideDecider, FalseDecider, TrueDecider } from './utils'

/*********
 * TESTS *
 *********/

describe('AndDecider', () => {
  let decider: AndDecider
  const trueDecider: TrueDecider = new TrueDecider()
  const falseDecider: FalseDecider = new FalseDecider()
  const cannotDecideDecider: CannotDecideDecider = new CannotDecideDecider()
  beforeEach(() => {
    decider = new AndDecider()
  })

  describe('decide and checkDecision', () => {
    it('should work with two true decision', async () => {
      // decider.
    })
  })
})
