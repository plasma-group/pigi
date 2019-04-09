export type Type<T> = new (...args: any[]) => T

export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never
}[keyof T]

export type OneOrMore<T> = T[] | T
