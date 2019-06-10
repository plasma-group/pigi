type BooleanOperator = '$and' | '$not' | '$or'
type ComparisonOperator = '$eq' | '$gt' | '$gte' | '$lt' | '$lte' | '$ne'
type QueryOperator = BooleanOperator | ComparisonOperator

export type Expression = {
  [operator in QueryOperator]?: Array<string | number | QueryExpression>
}
