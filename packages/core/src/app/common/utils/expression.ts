import { Expression } from '../../../interfaces'

const evaluators = {
  /* Boolean Operators */
  $and: (...args: Expression[]): boolean => {
    return args.every((arg) => {
      return evaluate(arg)
    })
  },
  $or: (...args: Expression[]): boolean => {
    return args.some((arg) => {
      return evaluate(arg)
    })
  },
  $not: (arg: Expression): boolean => {
    return !evaluate(arg)
  },

  /* Conditional Operators */
  $eq: (...args: any[]): boolean => {
    return args.every((arg: any) => {
      return arg === args[0]
    })
  },
  $ne: (...args: any[]): boolean => {
    return args.some((arg: any) => {
      return (
        args.reduce((count: number, other: any) => {
          return count + Number(arg === other)
        }, 0) === 1
      )
    })
  },
  $gt: (arg1: number, arg2: number): boolean => {
    return arg1 > arg2
  },
  $gte: (arg1: number, arg2: number): boolean => {
    return arg1 >= arg2
  },
  $lt: (arg1: number, arg2: number): boolean => {
    return arg1 < arg2
  },
  $lte: (arg1: number, arg2: number): boolean => {
    return arg1 <= arg2
  },
}

/**
 * Expands an expression into an operator and arguments.
 * @param expression Expression to expand.
 * @returns the operator and arguments.
 */
const expand = (expression: Expression): { operator: string; args: any[] } => {
  const operator = Object.keys(expression)[0]
  const args = expression[operator]

  return {
    operator,
    args,
  }
}

// Matches '$[0-9]'.
const QUERY_PARAMETER_REGEX = /^\$(\d+)/m

/**
 * Checks if an input value is a placeholder string of the form '$[0-9]'.
 * @param value Input value to check.
 * @returns `true` if the input is a placeholder string, `false` otherwise.
 */
const isPlaceholderString = (value: any): boolean => {
  return typeof value === 'string' && QUERY_PARAMETER_REGEX.test(value)
}

/**
 * Pulls the parameter index from a placeholder string of the form '$[0-9]'.
 * @param placeholder Placeholder string to replace.
 * @returns the parameter index from the placeholder string.
 */
const getParameterIndex = (placeholder: string): number => {
  return Number(QUERY_PARAMETER_REGEX.exec(placeholder)[1])
}

/**
 * Fills all placeholder strings within a given expression.
 * @param expression Expression to fill.
 * @param parameters Parameter list to pick placeholders from.
 * @returns the filled expression.
 */
const fillExpressionPlaceholders = (
  expression: Expression,
  parameters: any[] = []
): Expression => {
  const { operator, args } = expand(expression)

  expression[operator] = args.map((arg) => {
    if (isPlaceholderString(arg)) {
      return parameters[getParameterIndex(arg)]
    } else if (typeof arg === 'object') {
      return fillExpressionPlaceholders(arg, parameters)
    } else {
      return arg
    }
  })

  return expression
}

/**
 * Evaluates an expression with some parameters.
 * @param expression Expression to evaluate.
 * @param parameters Parameter list to fill placeholders with.
 * @returns the boolean result of the expression.
 */
export const evaluate = (
  expression: Expression,
  parameters: any[] = []
): boolean => {
  if (parameters.length > 0) {
    expression = fillExpressionPlaceholders(expression, parameters)
  }

  const { operator, args } = expand(expression)
  return evaluators[operator](...args)
}
