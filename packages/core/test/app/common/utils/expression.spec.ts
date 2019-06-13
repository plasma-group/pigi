import '../../../setup'

/* Internal Imports */
import { evaluate } from '../../../../src/app/common/utils/expression'
import { Expression } from '../../../../src/interfaces/common/utils/expression.interface'

const truthy = { $eq: [true, true] }
const falsy = { $eq: [true, false] }

describe('Expression Evaluation', () => {
  describe('Operators', () => {
    describe('$eq', () => {
      it('should return true for identical string values', () => {
        evaluate({ $eq: ['abc', 'abc'] }).should.be.true
      })
      it('should return true for identical numerical values', () => {
        evaluate({ $eq: [123, 123] }).should.be.true
      })
      it('should return false for different string values', () => {
        evaluate({ $eq: ['abc', 'def'] }).should.be.false
      })
      it('should return false for different numerical values', () => {
        evaluate({ $eq: [123, 456] }).should.be.false
      })
      it('should return false for different string and numerical values', () => {
        evaluate({ $eq: ['123', 132] }).should.be.false
      })
    })

    describe('$ne', () => {
      it('should return true for different string values', () => {
        evaluate({ $ne: ['abc', 'def'] }).should.be.true
      })
      it('should return true for different numerical values', () => {
        evaluate({ $ne: [123, 456] }).should.be.true
      })
      it('should return true for different string and numerical values', () => {
        evaluate({ $ne: ['123', 132] }).should.be.true
      })
      it('should return true for a single different value', () => {
        evaluate({ $ne: [1, 1, 1, 1, 2] }).should.be.true
      })
      it('should return false for identical string values', () => {
        evaluate({ $ne: ['abc', 'abc'] }).should.be.false
      })
      it('should return false for identical numerical values', () => {
        evaluate({ $ne: [123, 123] }).should.be.false
      })
    })

    describe('$gt', () => {
      it('should return true if the first argument is greater than the second', () => {
        evaluate({ $gt: [456, 123] }).should.be.true
      })

      it('should return false if the first argument is equal to the second', () => {
        evaluate({ $gt: [123, 123] }).should.be.false
      })

      it('should return false if the first argument is less than the second', () => {
        evaluate({ $gt: [123, 456] }).should.be.false
      })
    })

    describe('$gte', () => {
      it('should return true if the first argument is greater than the second', () => {
        evaluate({ $gte: [456, 123] }).should.be.true
      })

      it('should return true if the first argument is equal to the second', () => {
        evaluate({ $gte: [123, 123] }).should.be.true
      })

      it('should return false if the first argument is less than the second', () => {
        evaluate({ $gte: [123, 456] }).should.be.false
      })
    })

    describe('$lt', () => {
      it('should return true if the first argument is less than the second', () => {
        evaluate({ $lt: [123, 456] }).should.be.true
      })

      it('should return false if the first argument is equal to the second', () => {
        evaluate({ $lt: [123, 123] }).should.be.false
      })

      it('should return false if the first argument is greater than the second', () => {
        evaluate({ $lt: [456, 123] }).should.be.false
      })
    })

    describe('$lte', () => {
      it('should return true if the first argument is less than the second', () => {
        evaluate({ $lte: [123, 456] }).should.be.true
      })

      it('should return true if the first argument is equal to the second', () => {
        evaluate({ $lte: [123, 123] }).should.be.true
      })

      it('should return false if the first argument is less than the second', () => {
        evaluate({ $lte: [456, 123] }).should.be.false
      })
    })

    describe('$and', () => {
      it('should return true when all inputs return true', () => {
        evaluate({ $and: [truthy, truthy, truthy] }).should.be.true
      })

      it('should return false if one input returns false', () => {
        evaluate({ $and: [truthy, truthy, falsy] }).should.be.false
      })

      it('should return false if all inputs return false', () => {
        evaluate({ $and: [falsy, falsy, falsy] }).should.be.false
      })
    })

    describe('$or', () => {
      it('should return true if any input returns true', () => {
        evaluate({ $or: [truthy, falsy, falsy] }).should.be.true
      })

      it('should return true if all inputs return true', () => {
        evaluate({ $or: [truthy, truthy, truthy] }).should.be.true
      })

      it('should return false if all inputs return false', () => {
        evaluate({ $or: [falsy, falsy, falsy] }).should.be.false
      })
    })

    describe('$not', () => {
      it('should return true if the input returns false', () => {
        evaluate({ $not: [falsy] }).should.be.true
      })

      it('should return false if the input returns true', () => {
        evaluate({ $not: [truthy] }).should.be.false
      })
    })
  })

  describe('Placeholders', () => {
    it('should correctly evaluate an expression with a placeholder', () => {
      evaluate({ $gt: ['$0', 123] }, [456]).should.be.true
    })

    it('should correctly evaluate an expression with multiple placeholders', () => {
      evaluate({ $gt: ['$0', '$1'] }, [456, 123]).should.be.true
    })

    it('should correctly evaluate a nested expression with a placeholder', () => {
      evaluate({ $not: [{ $eq: ['$0', 123] }] }, [123]).should.be.false
    })
  })
})
