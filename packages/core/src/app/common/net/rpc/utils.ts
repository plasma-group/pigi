/* Internal Imports */
import { RpcServer, FunctionPropertyNames } from '../../../../interfaces'
import { autobind } from '../../utils'

/**
 * Registers methods to an RPC server by
 * binding them to a given object.
 * Gets around annoying `x.fn.bind(x)` calls.
 * @param rpc Server to register to.
 * @param obj Object to bind to.
 * @param fns Names of the functions to bind.
 */
export const registerBound = <T>(
  rpc: RpcServer,
  obj: T,
  fns: Array<FunctionPropertyNames<T>>
): void => {
  const methods = autobind(obj, fns)

  for (const name of Object.keys(methods)) {
    const method = methods[name]
    rpc.register(name, method)
  }
}
