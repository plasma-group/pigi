import '../../setup'
import { BigNumber, ZERO, ONE } from '../../../src/app/utils'
import * as assert from 'assert'

describe('BigNumber', () => {
  describe('constructor', () => {
    it('should handle number', () => {
      const num: BigNumber = new BigNumber(10)
      assert(num.toNumber() === 10, 'Could not construct BigNumber with number')
    })

    it('should handle base10 string', () => {
      const num: BigNumber = new BigNumber('10', 10)
      assert(num.toNumber() === 10, 'Could not construct BigNumber with number')
    })

    it('should handle hex string', () => {
      const num: BigNumber = new BigNumber('a', 'hex')
      assert(num.toNumber() === 10, 'Could not construct BigNumber with number')
    })

    it('should handle BigNumber', () => {
      const num: BigNumber = new BigNumber(new BigNumber(10))
      assert(num.toNumber() === 10, 'Could not construct BigNumber with number')
    })

    it('should handle Buffer', () => {
      const num: BigNumber = new BigNumber(new BigNumber(10).toBuffer())
      assert(num.toNumber() === 10, 'Could not construct BigNumber with number')
    })
  })

  describe('min', () => {
    it('first is less', () => {
      assert(BigNumber.min(ZERO, ONE).eq(ZERO))
    })

    it('second is less', () => {
      assert(BigNumber.min(ONE, ZERO).eq(ZERO))
    })

    it('they are equal', () => {
      assert(BigNumber.min(ZERO, ZERO).eq(ZERO))
    })
  })

  describe('max', () => {
    it('first is greater', () => {
      assert(BigNumber.max(ONE, ZERO).eq(ONE))
    })

    it('second is greater', () => {
      assert(BigNumber.max(ZERO, ONE).eq(ONE))
    })

    it('they are equal', () => {
      assert(BigNumber.max(ZERO, ZERO).eq(ZERO))
    })
  })

  describe('isBigNumber', () => {
    it('test BigNum', () => {
      assert(BigNumber.isBigNumber(ONE))
    })

    it('test number', () => {
      assert(!BigNumber.isBigNumber(1))
    })

    it('test undefined', () => {
      assert(!BigNumber.isBigNumber(undefined))
    })

    it('test null', () => {
      assert(!BigNumber.isBigNumber(null))
    })
  })

  describe('clone', () => {
    it('test different memory address', () => {
      const clone: BigNumber = ONE.clone()
      assert(clone.eq(ONE) && clone !== ONE)
    })
  })

  describe('toNumber', () => {
    it('test outputs correct number', () => {
      assert(new BigNumber(27).toNumber() === 27)
    })
  })

  describe('add', () => {
    it('test add positive', () => {
      assert(ONE.add(ONE).eq(new BigNumber(2)))
    })

    it('test add negative', () => {
      assert(ONE.add(new BigNumber(-1)).eq(ZERO))
    })
  })

  describe('sub', () => {
    it('test subtract positive', () => {
      assert(ONE.sub(ONE).eq(ZERO))
    })

    it('test subtract negative', () => {
      assert(ZERO.sub(new BigNumber(-1)).eq(ONE))
    })
  })

  describe('mul', () => {
    it('test multiply positive', () => {
      assert(new BigNumber(10).mul(new BigNumber(5)).eq(new BigNumber(50)))
    })

    it('test multiply negative', () => {
      assert(new BigNumber(10).mul(new BigNumber(-5)).eq(new BigNumber(-50)))
    })
  })

  describe('div', () => {
    it('test divide positive', () => {
      assert(new BigNumber(10).div(new BigNumber(5)).eq(new BigNumber(2)))
    })

    it('test divide negative', () => {
      assert(new BigNumber(10).div(new BigNumber(-5)).eq(new BigNumber(-2)))
    })

    it('test divide by 0 throws', () => {
      try {
        ONE.div(ZERO)
        assert(false, 'Divide by negative should have thrown')
      } catch (e) {
        assert(true, 'This should happen')
      }
    })
  })

  describe('divRound', () => {
    it('test divide & round down positive', () => {
      assert(new BigNumber(10).divRound(new BigNumber(3)).eq(new BigNumber(3)))
    })

    it('test divide & round down negative', () => {
      assert(
        new BigNumber(10).divRound(new BigNumber(-3)).eq(new BigNumber(-3))
      )
    })

    it('test divide & round up positive', () => {
      assert(new BigNumber(10).divRound(new BigNumber(9)).eq(new BigNumber(1)))
    })

    it('test divide & round up negative', () => {
      assert(
        new BigNumber(10).divRound(new BigNumber(-9)).eq(new BigNumber(-1))
      )
    })

    it('test divide by 0 throws', () => {
      try {
        ONE.divRound(ZERO)
        assert(false, 'Divide by negative should have thrown')
      } catch (e) {
        assert(true, 'This should happen')
      }
    })
  })

  describe('pow', () => {
    it('test positive power', () => {
      assert(new BigNumber(10).pow(new BigNumber(3)).eq(new BigNumber(1000)))
    })

    it('test negative power, positive result', () => {
      assert(new BigNumber(-10).pow(new BigNumber(3)).eq(new BigNumber(-1000)))
    })

    it('test negative power, negative result', () => {
      assert(new BigNumber(-10).pow(new BigNumber(2)).eq(new BigNumber(100)))
    })

    // None of these work because bn.js does not support them
    // it('test positive fractional power', () => {
    //   console.log(`100^-2 = ${new BigNumber(100).pow(new BigNumber(.5)).toString()}`)
    //   assert(new BigNumber(100).pow(new BigNumber(.5)).eq(new BigNumber(10)))
    // })
    //
    // it('test negative power', () => {
    //   assert(new BigNumber(100).pow(new BigNumber(-2)).eq(new BigNumber(0.0001)))
    // })
    //
    // it('test negative fractional power', () => {
    //   assert(new BigNumber(100).pow(new BigNumber(-.5)).eq(new BigNumber(0.1)))
    // })
  })

  describe('mod', () => {
    it('test positive mod', () => {
      assert(new BigNumber(10).mod(new BigNumber(3)).eq(ONE))
    })
  })

  describe('abs', () => {
    it('test abs positive', () => {
      assert(new BigNumber(10).abs().eq(new BigNumber(10)))
    })

    it('test abs negative', () => {
      assert(new BigNumber(-10).abs().eq(new BigNumber(10)))
    })
  })

  describe('gt', () => {
    it('test positive', () => {
      assert(new BigNumber(10).gt(new BigNumber(9)))
      assert(!new BigNumber(9).gt(new BigNumber(10)))
      assert(!new BigNumber(10).gt(new BigNumber(10)))
    })

    it('test negative', () => {
      assert(new BigNumber(10).gt(new BigNumber(-11)))
      assert(!new BigNumber(-11).gt(new BigNumber(10)))
    })

    it('test negatives', () => {
      assert(new BigNumber(-10).gt(new BigNumber(-11)))
      assert(!new BigNumber(-11).gt(new BigNumber(-10)))
      assert(!new BigNumber(-10).gt(new BigNumber(-10)))
    })
  })

  describe('gte', () => {
    it('test positive', () => {
      assert(new BigNumber(10).gte(new BigNumber(9)))
      assert(!new BigNumber(9).gte(new BigNumber(10)))
      assert(new BigNumber(10).gte(new BigNumber(10)))
    })

    it('test negative', () => {
      assert(new BigNumber(10).gte(new BigNumber(-11)))
      assert(!new BigNumber(-11).gte(new BigNumber(10)))
    })

    it('test negatives', () => {
      assert(new BigNumber(-10).gte(new BigNumber(-11)))
      assert(!new BigNumber(-11).gte(new BigNumber(-10)))
      assert(new BigNumber(-10).gte(new BigNumber(-10)))
    })
  })

  describe('lt', () => {
    it('test positive', () => {
      assert(!new BigNumber(10).lt(new BigNumber(9)))
      assert(new BigNumber(9).lt(new BigNumber(10)))
      assert(!new BigNumber(10).lt(new BigNumber(10)))
    })

    it('test negative', () => {
      assert(!new BigNumber(10).lt(new BigNumber(-11)))
      assert(new BigNumber(-11).lt(new BigNumber(10)))
    })

    it('test negatives', () => {
      assert(!new BigNumber(-10).lt(new BigNumber(-11)))
      assert(new BigNumber(-11).lt(new BigNumber(-10)))
      assert(!new BigNumber(-10).lt(new BigNumber(-10)))
    })
  })

  describe('lte', () => {
    it('test positive', () => {
      assert(!new BigNumber(10).lte(new BigNumber(9)))
      assert(new BigNumber(9).lte(new BigNumber(10)))
      assert(new BigNumber(10).lte(new BigNumber(10)))
    })

    it('test negative', () => {
      assert(!new BigNumber(10).lte(new BigNumber(-11)))
      assert(new BigNumber(-11).lte(new BigNumber(10)))
    })

    it('test negatives', () => {
      assert(!new BigNumber(-10).lte(new BigNumber(-11)))
      assert(new BigNumber(-11).lte(new BigNumber(-10)))
      assert(new BigNumber(-10).lte(new BigNumber(-10)))
    })
  })

  describe('eq', () => {
    it('test positive', () => {
      assert(new BigNumber(10).eq(new BigNumber(10)))
      assert(!new BigNumber(9).eq(new BigNumber(10)))
    })

    it('test negative', () => {
      assert(new BigNumber(-10).eq(new BigNumber(-10)))
      assert(!new BigNumber(-11).eq(new BigNumber(-10)))
    })
  })

  describe('compare', () => {
    it('test first is less', () => {
      assert(new BigNumber(10).compare(new BigNumber(11)) === -1)
      assert(new BigNumber(-11).compare(new BigNumber(-10)) === -1)
    })

    it('test second is less', () => {
      assert(new BigNumber(11).compare(new BigNumber(10)) === 1)
      assert(new BigNumber(-10).compare(new BigNumber(-11)) === 1)
    })

    it('test equal', () => {
      assert(new BigNumber(10).compare(new BigNumber(10)) === 0)
      assert(new BigNumber(-10).compare(new BigNumber(-10)) === 0)
    })
  })
})
